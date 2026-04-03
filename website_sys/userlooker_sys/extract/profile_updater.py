"""
Profile Updater — Shared Utility Module
Provides atomic $inc-based update functions for the user_profiles collection.

Used by:
  - dce_extractor.py  (real-time updates on message ingest)
  - profile_backfill.py (initial backfill from existing messages)
  - ai_message_extractor.py (syncing roblox_usernames after AI analysis)

Schema: user_profiles
{
  "_id":                   str   — Discord snowflake ID (natural key)
  "discord_id":            str   — Same as _id (for clarity in queries)
  "roblox_usernames":      [str] — All detected Roblox accounts
  "primary_roblox_username": str — Best-guess primary account
  "discord_username":      str   — Latest Discord username
  "avatar_url":            str   — Latest avatar URL

  "message_count":         int   — Total messages across all servers
  "guild_ids":             [str] — Unique server IDs where user was seen
  "guild_count":           int   — len(guild_ids), kept in sync

  "first_seen":            datetime — Oldest message timestamp
  "last_seen":             datetime — Most recent message timestamp

  "heatmap": {                   — 7×24 matrix (UTC)
    "0": {"0": int, ..., "23": int},  — Monday
    ...
    "6": {"0": int, ..., "23": int}   — Sunday
  }

  "rank_history":          []    — Reserved for future use
  "top_channels":          []    — Reserved for future use
  "ai_tags":               []    — Reserved for future use
  "ai_analyzed_at":        datetime|null

  "updated_at":            datetime
}
"""

import os
from datetime import datetime
from pymongo import MongoClient, UpdateOne
from pymongo.database import Database
from dotenv import load_dotenv

load_dotenv()

# ─── Configuration ────────────────────────────────────────────
MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = int(os.getenv("MONGO_PORT", "27017"))
DB_NAME = os.getenv("DB_NAME", "discord_data")
PROFILES_COLLECTION = "user_profiles"


def get_profiles_collection(db: Database):
    """Get the user_profiles collection from an existing database handle."""
    return db[PROFILES_COLLECTION]


def ensure_profile_indexes(db: Database):
    """Create indexes for the user_profiles collection."""
    coll = get_profiles_collection(db)

    # _id is already indexed (natural key = discord_id)
    coll.create_index("primary_roblox_username", sparse=True)
    coll.create_index([("message_count", -1)])  # Leaderboard
    coll.create_index("roblox_usernames", sparse=True)  # Search by any Roblox name

    print(f"Ensured indexes on {DB_NAME}.{PROFILES_COLLECTION}")


# ─── Atomic Single-Message Update ─────────────────────────────

def increment_profile(db: Database, discord_id: str, timestamp: datetime,
                      guild_id: str = None, discord_username: str = None,
                      avatar_url: str = None):
    """
    Atomic $inc update for a single message.
    Called from dce_extractor.py on each ingested message.

    Uses:
      $inc  — message_count, heatmap cell
      $min  — first_seen
      $max  — last_seen
      $addToSet — guild_ids
      $set  — updated_at, optional discord_username/avatar_url
    """
    coll = get_profiles_collection(db)

    day = str(timestamp.weekday())   # 0=Monday, 6=Sunday
    hour = str(timestamp.hour)       # 0-23

    update_ops = {
        "$inc": {
            "message_count": 1,
            f"heatmap.{day}.{hour}": 1
        },
        "$min": {"first_seen": timestamp},
        "$max": {"last_seen": timestamp},
        "$set": {"updated_at": datetime.utcnow()}
    }

    if guild_id:
        update_ops["$addToSet"] = {"guild_ids": guild_id}

    # Optionally update username/avatar with latest values
    set_fields = update_ops["$set"]
    if discord_username:
        set_fields["discord_username"] = discord_username
    if avatar_url:
        set_fields["avatar_url"] = avatar_url

    coll.update_one(
        {"_id": discord_id},
        update_ops,
        upsert=True
    )


# ─── Batch Profile Update (for efficient bulk processing) ─────

def build_profile_update_op(discord_id: str, timestamp: datetime,
                            guild_id: str = None,
                            discord_username: str = None,
                            avatar_url: str = None) -> UpdateOne:
    """
    Build a single UpdateOne operation for bulk_write.
    Used by dce_extractor and profile_backfill for batch efficiency.
    """
    day = str(timestamp.weekday())
    hour = str(timestamp.hour)

    update_ops = {
        "$inc": {
            "message_count": 1,
            f"heatmap.{day}.{hour}": 1
        },
        "$min": {"first_seen": timestamp},
        "$max": {"last_seen": timestamp},
        "$set": {"updated_at": datetime.utcnow()}
    }

    if guild_id:
        update_ops["$addToSet"] = {"guild_ids": guild_id}

    set_fields = update_ops["$set"]
    if discord_username:
        set_fields["discord_username"] = discord_username
    if avatar_url:
        set_fields["avatar_url"] = avatar_url

    return UpdateOne({"_id": discord_id}, update_ops, upsert=True)


def bulk_update_profiles(db: Database, operations: list, batch_size: int = 100):
    """
    Execute a list of UpdateOne operations in batches.
    Returns total modified + upserted count.
    """
    if not operations:
        return 0

    coll = get_profiles_collection(db)
    total = 0

    for i in range(0, len(operations), batch_size):
        batch = operations[i:i + batch_size]
        result = coll.bulk_write(batch, ordered=False)
        total += result.modified_count + result.upserted_count

    return total


# ─── Roblox Username Sync ─────────────────────────────────────

def sync_roblox_usernames(db: Database, discord_id: str,
                          roblox_usernames: list,
                          primary_username: str = None):
    """
    Sync Roblox usernames to a user's profile.
    Called from ai_message_extractor.py after AI analysis.

    Args:
        discord_id: Discord snowflake ID
        roblox_usernames: List of all detected Roblox usernames
        primary_username: Best-guess primary account (highest confidence)
    """
    coll = get_profiles_collection(db)

    update = {
        "$addToSet": {"roblox_usernames": {"$each": roblox_usernames}},
        "$set": {"updated_at": datetime.utcnow()}
    }

    if primary_username:
        update["$set"]["primary_roblox_username"] = primary_username

    coll.update_one(
        {"_id": discord_id},
        update,
        upsert=True
    )


# ─── Guild Count Recalculation ────────────────────────────────

def recount_guild_counts(db: Database):
    """
    Recount guild_count from guild_ids array for all profiles.
    Run after backfill or periodically as maintenance.
    """
    coll = get_profiles_collection(db)

    pipeline = [
        {"$project": {
            "guild_count": {"$size": {"$ifNull": ["$guild_ids", []]}}
        }}
    ]

    bulk_ops = []
    for doc in coll.aggregate(pipeline):
        bulk_ops.append(UpdateOne(
            {"_id": doc["_id"]},
            {"$set": {"guild_count": doc["guild_count"]}}
        ))

    if bulk_ops:
        result = coll.bulk_write(bulk_ops, ordered=False)
        return result.modified_count
    return 0


# ─── Initialize Empty Profile ─────────────────────────────────

def get_empty_heatmap() -> dict:
    """Return an empty 7x24 heatmap matrix."""
    return {
        str(day): {str(hour): 0 for hour in range(24)}
        for day in range(7)
    }


def initialize_profile(db: Database, discord_id: str,
                        discord_username: str = None,
                        avatar_url: str = None):
    """
    Initialize an empty profile document.
    Only creates if it doesn't exist (no overwrite).
    """
    coll = get_profiles_collection(db)

    coll.update_one(
        {"_id": discord_id},
        {
            "$setOnInsert": {
                "discord_id": discord_id,
                "roblox_usernames": [],
                "primary_roblox_username": None,
                "discord_username": discord_username,
                "avatar_url": avatar_url,
                "message_count": 0,
                "guild_ids": [],
                "guild_count": 0,
                "first_seen": None,
                "last_seen": None,
                "heatmap": get_empty_heatmap(),
                "rank_history": [],
                "top_channels": [],
                "ai_tags": [],
                "ai_analyzed_at": None,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )
