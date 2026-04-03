"""
Profile Backfill Script
Processes all existing messages in message_db to build user_profiles from scratch.

This is a ONE-TIME script (safe to re-run — uses upsert).
It reads every message, computes per-user statistics, and writes them to
the user_profiles collection using batched bulk operations.

Usage:
    python extract/profile_backfill.py [--batch-size 100] [--delay 0.5] [--port 27018]
    python extract/profile_backfill.py --user 840090253272416257
    python extract/profile_backfill.py --dry-run
"""

import os
import sys
import time
import argparse
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

# Import shared profile updater
from profile_updater import (
    get_profiles_collection,
    ensure_profile_indexes,
    sync_roblox_usernames,
    recount_guild_counts,
    get_empty_heatmap,
    PROFILES_COLLECTION
)

load_dotenv()

# ─── Configuration ────────────────────────────────────────────
MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = int(os.getenv("MONGO_PORT", "27017"))
DB_NAME = os.getenv("DB_NAME", "discord_data")
MESSAGE_DB_NAME = os.getenv("MESSAGE_DB_NAME", "message_db")

# AI Analytics Tiering
HIGH_VOLUME_THRESHOLD = 1000  # Users with 1000+ messages get smaller AI sample
HIGH_VOLUME_SAMPLE = 100      # Weighted sample size for high-volume users
NORMAL_SAMPLE = 300            # Normal sample size


# ─── MongoDB Setup ────────────────────────────────────────────

def init_mongodb(port: int = None):
    """Initialize MongoDB connection and return (db, message_db) tuple."""
    mongo_port = port if port else MONGO_PORT
    mongo_uri = f"mongodb://{MONGO_HOST}:{mongo_port}"

    print(f"Connecting to MongoDB at {mongo_uri}...")
    client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )

    # Verify connection
    try:
        client.list_database_names()
        print("MongoDB connection successful!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

    db = client[DB_NAME]
    message_db = client[MESSAGE_DB_NAME]

    # Verify messages collection exists
    if "messages" not in message_db.list_collection_names():
        print("Error: 'messages' collection not found in message_db.")
        sys.exit(1)

    return db, message_db


# ─── Timestamp Parser ─────────────────────────────────────────

def parse_timestamp(timestamp_str: str) -> datetime:
    """Parse ISO timestamp string to datetime object (UTC)."""
    if not timestamp_str:
        return None

    # If it's already a datetime, return it
    if isinstance(timestamp_str, datetime):
        return timestamp_str

    # Remove timezone info for parsing
    if '+' in timestamp_str:
        timestamp_str = timestamp_str.split('+')[0]
    if timestamp_str.endswith('Z'):
        timestamp_str = timestamp_str[:-1]

    # Handle varying microsecond precision
    if '.' in timestamp_str:
        base, frac = timestamp_str.rsplit('.', 1)
        frac = frac.ljust(6, '0')[:6]
        timestamp_str = f"{base}.{frac}"

    return datetime.fromisoformat(timestamp_str)


# ─── Per-User Aggregation Pipeline ────────────────────────────

def build_user_profile_from_messages(message_db, discord_id: str) -> dict:
    """
    Run a single aggregation to compute all profile fields for one user.

    Returns a dict with:
      message_count, first_seen, last_seen, guild_ids, heatmap,
      discord_username, avatar_url
    """
    pipeline = [
        {"$match": {"discord_user_id": discord_id}},
        {"$group": {
            "_id": "$discord_user_id",
            "message_count": {"$sum": 1},
            "first_seen": {"$min": "$timestamp"},
            "last_seen": {"$max": "$timestamp"},
            "guild_ids": {"$addToSet": "$guild.id"},
            # Grab latest author info
            "latest_msg": {"$last": "$$ROOT"},
        }}
    ]

    results = list(message_db["messages"].aggregate(pipeline))
    if not results:
        return None

    agg = results[0]

    # Parse timestamps
    first_seen = parse_timestamp(agg["first_seen"])
    last_seen = parse_timestamp(agg["last_seen"])

    # Get latest author metadata
    latest = agg.get("latest_msg", {})
    author = latest.get("author", {})
    discord_username = author.get("name")
    avatar_url = author.get("avatarUrl")

    # Filter out None guild IDs
    guild_ids = [g for g in agg.get("guild_ids", []) if g]

    return {
        "message_count": agg["message_count"],
        "first_seen": first_seen,
        "last_seen": last_seen,
        "guild_ids": guild_ids,
        "guild_count": len(guild_ids),
        "discord_username": discord_username,
        "avatar_url": avatar_url,
    }


def build_heatmap_from_messages(message_db, discord_id: str) -> dict:
    """
    Compute the 7x24 heatmap matrix for a user by scanning their messages.
    Uses a lightweight projection to only fetch timestamps.
    """
    heatmap = get_empty_heatmap()

    cursor = message_db["messages"].find(
        {"discord_user_id": discord_id},
        {"timestamp": 1, "_id": 0}
    )

    for msg in cursor:
        ts = parse_timestamp(msg.get("timestamp"))
        if ts:
            day = str(ts.weekday())
            hour = str(ts.hour)
            heatmap[day][hour] += 1

    return heatmap


# ─── Roblox Username Cross-Reference ──────────────────────────

def get_roblox_usernames_for_discord(db, discord_id: str) -> tuple:
    """
    Look up Roblox usernames from known_users collection for this Discord ID.

    Returns: (roblox_usernames_list, primary_username_or_none)
    """
    known_users = db["known_users"]

    # Find all known_users documents that contain this Discord ID
    cursor = known_users.find(
        {"DiscordAccounts.DiscordUserId": discord_id},
        {"RobloxUsername": 1, "AI_Confidence": 1}
    )

    usernames = []
    best_name = None
    best_confidence = -1

    for doc in cursor:
        name = doc.get("RobloxUsername")
        confidence = doc.get("AI_Confidence", 0) or 0

        if name:
            usernames.append(name)
            if confidence > best_confidence:
                best_confidence = confidence
                best_name = name

    # If no confidence data, pick first alphabetically for consistency
    if best_name is None and usernames:
        best_name = sorted(usernames)[0]

    return usernames, best_name


# ─── Main Backfill Logic ──────────────────────────────────────

def backfill_user(db, message_db, discord_id: str, dry_run: bool = False) -> dict:
    """
    Backfill a single user's profile.
    Returns the computed profile dict (or None if no messages).
    """
    # Step 1: Aggregate message stats
    profile_data = build_user_profile_from_messages(message_db, discord_id)
    if not profile_data:
        return None

    # Step 2: Build heatmap
    heatmap = build_heatmap_from_messages(message_db, discord_id)

    # Step 3: Cross-reference Roblox usernames
    roblox_usernames, primary_username = get_roblox_usernames_for_discord(db, discord_id)

    # Step 4: Build the full profile document
    profile = {
        "_id": discord_id,
        "discord_id": discord_id,
        "roblox_usernames": roblox_usernames,
        "primary_roblox_username": primary_username,
        "discord_username": profile_data["discord_username"],
        "avatar_url": profile_data["avatar_url"],
        "message_count": profile_data["message_count"],
        "guild_ids": profile_data["guild_ids"],
        "guild_count": profile_data["guild_count"],
        "first_seen": profile_data["first_seen"],
        "last_seen": profile_data["last_seen"],
        "heatmap": heatmap,
        "rank_history": [],
        "top_channels": [],
        "ai_tags": [],
        "ai_analyzed_at": None,
        "updated_at": datetime.utcnow(),
    }

    if not dry_run:
        coll = get_profiles_collection(db)
        coll.update_one(
            {"_id": discord_id},
            {"$set": profile},
            upsert=True
        )

    return profile


def main():
    parser = argparse.ArgumentParser(
        description="Backfill user_profiles from existing messages"
    )
    parser.add_argument("--port", type=int, help="MongoDB port")
    parser.add_argument("--batch-size", type=int, default=100,
                        help="Users to process per batch (default: 100)")
    parser.add_argument("--delay", type=float, default=0.5,
                        help="Seconds between batches (default: 0.5)")
    parser.add_argument("--limit", type=int,
                        help="Limit total users to process (for testing)")
    parser.add_argument("--user", type=str,
                        help="Process a single Discord ID")
    parser.add_argument("--dry-run", action="store_true",
                        help="Compute profiles without writing to DB")

    args = parser.parse_args()

    # ─── Init ─────────────────────────────────────────────────
    db, message_db = init_mongodb(args.port)
    ensure_profile_indexes(db)

    start_time = datetime.now()

    # ─── Get Target Users ─────────────────────────────────────
    if args.user:
        target_ids = [args.user]
    else:
        print("Fetching unique user IDs from message_db.messages...")
        target_ids = message_db["messages"].distinct("discord_user_id")

        if args.limit:
            target_ids = target_ids[:args.limit]

    total = len(target_ids)
    print(f"Total users to backfill: {total}")
    print(f"Batch size: {args.batch_size} | Delay: {args.delay}s")

    if args.dry_run:
        print("*** DRY RUN — no database writes ***")

    # ─── Process in Batches ───────────────────────────────────
    processed = 0
    skipped = 0
    total_messages = 0

    for i in range(0, total, args.batch_size):
        batch_ids = target_ids[i:i + args.batch_size]
        batch_start = time.time()

        for j, discord_id in enumerate(batch_ids):
            idx = i + j + 1
            print(f"[{idx}/{total}] Backfilling {discord_id}...", end=" ")

            try:
                profile = backfill_user(db, message_db, discord_id, dry_run=args.dry_run)

                if profile:
                    msg_count = profile["message_count"]
                    guild_count = profile["guild_count"]
                    roblox = profile.get("primary_roblox_username", "?")
                    total_messages += msg_count

                    # AI tiering indicator
                    tier = "⚡" if msg_count >= HIGH_VOLUME_THRESHOLD else "📊"

                    print(f"{tier} {msg_count} msgs | {guild_count} guilds | Roblox: {roblox}")
                    processed += 1
                else:
                    print("⏭ No messages found")
                    skipped += 1

            except Exception as e:
                print(f"❌ Error: {e}")
                skipped += 1

        # Batch delay
        batch_elapsed = time.time() - batch_start
        if i + args.batch_size < total:
            print(f"  Batch complete ({batch_elapsed:.1f}s). Sleeping {args.delay}s...")
            time.sleep(args.delay)

    # ─── Post-Backfill: Recount Guild Counts ──────────────────
    if not args.dry_run:
        print("\nRecounting guild_count for all profiles...")
        updated = recount_guild_counts(db)
        print(f"Updated {updated} guild counts.")

    # ─── Summary ──────────────────────────────────────────────
    elapsed = datetime.now() - start_time

    print(f"\n{'='*55}")
    print(f"           BACKFILL COMPLETE")
    print(f"{'='*55}")
    print(f"  Users processed:    {processed}")
    print(f"  Users skipped:      {skipped}")
    print(f"  Total messages:     {total_messages:,}")
    print(f"  Elapsed time:       {elapsed}")
    print(f"  Avg time/user:      {elapsed.total_seconds() / max(processed, 1):.2f}s")

    if not args.dry_run:
        coll = get_profiles_collection(db)
        profile_count = coll.count_documents({})
        print(f"  Profiles in DB:     {profile_count}")

    print(f"{'='*55}")
    print("Done!")


if __name__ == "__main__":
    main()
