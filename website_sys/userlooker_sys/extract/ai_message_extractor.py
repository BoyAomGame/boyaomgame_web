"""
AI Message Connection Extractor
Retroactively scans message_db to detect Roblox-Discord connections using Gemini AI.

Usage:
    python extract/ai_message_extractor.py [--limit N] [--user DISCORD_ID] [--dry-run]
"""

import os
import sys
import json
import time
import random
import argparse
import asyncio
from datetime import datetime
from pathlib import Path
from pymongo import MongoClient, UpdateOne, DeleteOne
from dotenv import load_dotenv

load_dotenv()

# Configuration
MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = int(os.getenv("MONGO_PORT", "27017"))
DB_NAME = os.getenv("DB_NAME", "discord_data")
MESSAGE_DB_NAME = os.getenv("MESSAGE_DB_NAME", "message_db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# AI Configuration
CONFIDENCE_THRESHOLD = 70
RANDOM_SAMPLE_SIZE = 300
BATCH_SIZE = 50
RATE_LIMIT_DELAY = 2  # Seconds between API calls

# Global MongoDB references
client = None
db = None
message_db = None
known_users_collection = None
unknown_users_collection = None

def init_mongodb(port: int = None):
    """Initialize MongoDB connection."""
    global client, db, message_db, known_users_collection, unknown_users_collection
    
    mongo_port = port if port else MONGO_PORT
    mongo_uri = f"mongodb://{MONGO_HOST}:{mongo_port}"
    
    print(f"Connecting to MongoDB at {mongo_uri}...")
    client = MongoClient(mongo_uri)
    db = client[DB_NAME]
    message_db = client[MESSAGE_DB_NAME]
    known_users_collection = db["known_users"]
    unknown_users_collection = db["unknown_users"]
    
    # Check if necessary collections exist
    if "messages" not in message_db.list_collection_names():
        print("Error: 'messages' collection not found in message_db.")
        sys.exit(1)

    # Ensure index on discord_user_id to prevent full collection scans (Bug #3)
    message_db["messages"].create_index("discord_user_id")
    print("Ensured index on message_db.messages.discord_user_id")

def init_gemini():
    """Initialize Gemini AI client."""
    import google.generativeai as genai
    
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY must be set in .env")
    
    genai.configure(api_key=GEMINI_API_KEY)
    
    model_name = "gemini-2.5-flash-lite"
    try:
        # Check if 2.5 is available, if not explicitly requested string may work or error
        model = genai.GenerativeModel(model_name)
        # Test model with a simple prompt if needed, but for now we trust user
        return model
    except Exception as e:
        print(f"Warning: {model_name} failed to initialize ({e}). Falling back to gemini-2.0-flash-lite.")
        return genai.GenerativeModel("gemini-2.0-flash-lite")

def get_unique_user_ids(limit: int = None):
    """Get all unique Discord user IDs from messages collection."""
    print("Fetching unique user IDs from message_db.messages...")
    user_ids = message_db["messages"].distinct("discord_user_id")

    if limit:
        random.shuffle(user_ids)
        user_ids = user_ids[:limit]

    return user_ids


def get_already_processed_ids():
    """Get Discord user IDs that have already been processed (exist in known or unknown collections)."""
    processed = set()

    # Collect IDs from known_users (nested inside DiscordAccounts array)
    for doc in known_users_collection.find({}, {"DiscordAccounts.DiscordUserId": 1}):
        for acct in doc.get("DiscordAccounts", []):
            uid = acct.get("DiscordUserId")
            if uid:
                processed.add(uid)

    # Collect IDs from unknown_users (flat DiscordUserId field)
    for doc in unknown_users_collection.find({"ProcessedByAI": True}, {"DiscordUserId": 1}):
        uid = doc.get("DiscordUserId")
        if uid:
            processed.add(uid)

    return processed

def get_user_sample_messages(discord_id: str):
    """Fetch a random sample of messages for a user."""
    # Count total messages first
    total_msgs = message_db["messages"].count_documents({"discord_user_id": discord_id})
    
    if total_msgs == 0:
        return []

    # If count <= RANDOM_SAMPLE_SIZE, get all
    if total_msgs <= RANDOM_SAMPLE_SIZE:
        messages = list(message_db["messages"].find({"discord_user_id": discord_id}))
    else:
        # Random sampling using $sample aggregation or simply skipping random offsets
        # $sample is better for randomness
        pipeline = [
            {"$match": {"discord_user_id": discord_id}},
            {"$sample": {"size": RANDOM_SAMPLE_SIZE}}
        ]
        messages = list(message_db["messages"].aggregate(pipeline))
    
    return messages

def format_messages_for_ai(messages: list):
    """Format message list into a clean text block for AI."""
    formatted = []
    for m in messages:
        timestamp = m.get("timestamp", "Unknown Time")
        # author metadata is usually stored in the message object in dce_extractor
        author = m.get("author", {})
        nickname = author.get("nickname", "No Nickname")
        guild_id = m.get("guild", {}).get("id", "Unknown Server")
        channel = m.get("channel", {}).get("name", "Unknown Channel")
        content = m.get("content", "").strip()
        
        if not content:
            continue
            
        formatted.append(f"[{timestamp}] [Server:{guild_id}] [Nick:{nickname}] [Chan:{channel}] {content}")
    
    return "\n".join(formatted)

def create_prompt(discord_id: str, message_text: str):
    """Generate the AI prompt — supports multi-account detection."""
    return f"""You are a specialized identity analysis AI. Your goal is to identify ALL Roblox usernames that a Discord user may own based on their message history.

**Discord User ID to Analyze**: {discord_id}

**IMPORTANT — Multi-Account Awareness**:
A single Discord user may use DIFFERENT Roblox accounts in different servers. For example, they might be "Roblox101" in Server A and "Roblox301" in Server B. You MUST detect ALL distinct Roblox identities, not just one.

**Instructions**:
1. Scan the provided messages for clues about the user's Roblox account(s).
2. Look for explicit statements like "my user is [name]", "add me: [name]", or ";verify [name]".
3. Distinguish between the user mentioning their own name vs. a friend's name.
4. **Metadata Clues**:
    - **Nick (Nickname)**: Pay close attention to this. Users often format their names as "Rank | Username" in these servers.
    - **Server ID**: Compare nicknames and statements ACROSS servers. Different Server IDs may reveal different Roblox accounts.
    - **Chan (Channel)**: Mentions in verification or support channels are high-value evidence.
5. For EACH detected Roblox identity, evaluate your confidence (0-100) independently.
6. Include the server_id(s) where each account was observed.
7. **ACCURACY IS CRITICAL**: Only claim a username if the context strongly suggests it belongs to the Discord user being analyzed.
8. If no accounts are found, return an empty "accounts" array.

**Messages**:
{message_text}

Respond ONLY with valid JSON in this exact format:
{{
    "discord_id": "{discord_id}",
    "accounts": [
        {{
            "roblox_username": "detected_name",
            "confidence": 85,
            "evidence": "brief explanation",
            "is_certain": true,
            "server_ids": ["server_id_1", "server_id_2"]
        }}
    ]
}}

If only one account is found, the array should have one element.
If none are found, return an empty array: "accounts": []
"""

async def analyze_user(model, discord_id: str, debug: bool = False):
    """Fetch data, prompt AI, and return multi-account result asynchronously."""
    messages = get_user_sample_messages(discord_id)
    if not messages:
        return None

    message_text = format_messages_for_ai(messages)
    prompt = create_prompt(discord_id, message_text)

    try:
        response = await model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        data = json.loads(response.text)

        # Normalize: ensure we always have the multi-account format
        if "accounts" not in data:
            # Legacy single-account fallback
            data = {
                "discord_id": discord_id,
                "accounts": [{
                    "roblox_username": data.get("roblox_username"),
                    "confidence": data.get("confidence", 0),
                    "evidence": data.get("evidence", ""),
                    "is_certain": data.get("is_certain", False),
                    "server_ids": []
                }] if data.get("roblox_username") else []
            }

        # Ensure discord_id is always present
        data["discord_id"] = discord_id
        return data

    except Exception as e:
        print(f"Error analyzing user {discord_id}: {e}")
        return None


def update_database(results: list, dry_run: bool = False):
    """Update known_users and unknown_users collections (multi-account aware)."""
    if dry_run:
        print(f"Dry run: Would update {len(results)} records.")
        return

    known_ops = []
    unknown_ops = []

    for res in results:
        discord_id = res["discord_id"]
        accounts = res.get("accounts", [])

        # Filter accounts that meet the confidence threshold
        valid_accounts = [
            acc for acc in accounts
            if acc.get("roblox_username") and acc.get("confidence", 0) >= CONFIDENCE_THRESHOLD
        ]

        if valid_accounts:
            for acc in valid_accounts:
                roblox_name = acc["roblox_username"]
                confidence = acc["confidence"]
                server_ids = acc.get("server_ids", [])

                known_ops.append(UpdateOne(
                    {"RobloxUsername": roblox_name},
                    {
                        "$addToSet": {"DiscordAccounts": {
                            "DiscordUserId": discord_id,
                            "ServerIds": server_ids
                        }},
                        "$set": {
                            "AI_Analyzed": datetime.utcnow(),
                            "AI_Confidence": confidence
                        }
                    },
                    upsert=True
                ))

            # At least one valid account found — remove from unknown
            unknown_ops.append(DeleteOne(
                {"DiscordUserId": discord_id}
            ))
        else:
            # No valid accounts — mark as Unknown
            unknown_ops.append(UpdateOne(
                {"DiscordUserId": discord_id},
                {
                    "$set": {
                        "DiscordUserId": discord_id,
                        "AI_Analyzed": datetime.utcnow(),
                        "ProcessedByAI": True,
                        "Status": "Unknown",
                        "AI_AccountsFound": len(accounts),
                    }
                },
                upsert=True
            ))

    if known_ops:
        known_users_collection.bulk_write(known_ops)
    if unknown_ops:
        unknown_users_collection.bulk_write(unknown_ops)

# --- Concurrency settings ---
MAX_CONCURRENT_API_CALLS = 10  # Gemini API concurrency limit


async def process_user(semaphore: asyncio.Semaphore, model, discord_id: str, index: int, total: int, debug: bool = False):
    """Process a single user with semaphore-based rate limiting."""
    async with semaphore:
        print(f"[{index}/{total}] Analyzing {discord_id}...")
        result = await analyze_user(model, discord_id, debug=debug)
        if result:
            accounts = result.get("accounts", [])
            if accounts:
                for acc in accounts:
                    name = acc.get('roblox_username', '?')
                    conf = acc.get('confidence', 0)
                    certain = acc.get('is_certain', False)
                    servers = ', '.join(acc.get('server_ids', [])) or 'N/A'
                    print(f"  -> {name} (Conf: {conf}% | Certain: {certain} | Servers: {servers})")
                    if debug:
                        print(f"     Evidence: {acc.get('evidence', '')}")
            else:
                print(f"  No Roblox accounts detected.")
        # Small delay per call to respect API rate limits
        await asyncio.sleep(RATE_LIMIT_DELAY)
        return result


async def main_async():
    """Fully asynchronous main function using asyncio.gather for concurrency."""
    parser = argparse.ArgumentParser(description="AI Message Identity Extractor")
    parser.add_argument("--limit", type=int, help="Limit number of users to process")
    parser.add_argument("--user", type=str, help="Process a specific Discord ID")
    parser.add_argument("--dry-run", action="store_true", help="Don't save to DB")
    parser.add_argument("--port", type=int, help="MongoDB port")
    parser.add_argument("--debug", action="store_true", help="Show raw AI response")
    parser.add_argument("--concurrency", type=int, default=MAX_CONCURRENT_API_CALLS,
                        help=f"Max concurrent API calls (default: {MAX_CONCURRENT_API_CALLS})")
    parser.add_argument("--reprocess", action="store_true",
                        help="Re-analyze users even if they already exist in known/unknown collections")

    args = parser.parse_args()

    init_mongodb(args.port)
    model = init_gemini()

    if args.user:
        target_ids = [args.user]
    else:
        target_ids = get_unique_user_ids(args.limit)

    # Skip already-processed users unless --reprocess is set
    if not args.reprocess:
        already_processed = get_already_processed_ids()
        before_count = len(target_ids)
        target_ids = [uid for uid in target_ids if uid not in already_processed]
        skipped = before_count - len(target_ids)
        if skipped > 0:
            print(f"Skipped {skipped} already-processed users (use --reprocess to force re-analysis)")
    else:
        print("--reprocess flag set: re-analyzing ALL users regardless of DB status")

    total = len(target_ids)
    print(f"Total users to analyze: {total}")
    print(f"Concurrency limit: {args.concurrency}")

    semaphore = asyncio.Semaphore(args.concurrency)

    # Process in batches of BATCH_SIZE for periodic DB writes
    for batch_start in range(0, total, BATCH_SIZE):
        batch_ids = target_ids[batch_start:batch_start + BATCH_SIZE]
        tasks = [
            process_user(semaphore, model, uid, batch_start + j + 1, total, debug=args.debug)
            for j, uid in enumerate(batch_ids)
        ]

        # Run all tasks in this batch concurrently
        batch_results = await asyncio.gather(*tasks)

        # Filter out None results and write to DB
        valid_results = [r for r in batch_results if r is not None]
        if valid_results:
            update_database(valid_results, args.dry_run)
            print(f"  Batch [{batch_start + 1}-{batch_start + len(batch_ids)}]: Wrote {len(valid_results)} results to DB.")

    print("Processing complete.")


def main():
    """Entry point — runs the async main."""
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
