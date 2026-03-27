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
from pymongo import MongoClient, UpdateOne
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
    # Use distinct for efficiency, though it might hit memory limit on 10k+
    # On 10k+ users, distinct is usually fine for a 16MB result limit.
    user_ids = message_db["messages"].distinct("discord_user_id")
    
    if limit:
        random.shuffle(user_ids)
        user_ids = user_ids[:limit]
    
    return user_ids

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
    """Generate the AI prompt."""
    return f"""You are a specialized identity analysis AI. Your goal is to identify a Discord user's Roblox username based on their message history.

**Discord User ID to Analyze**: {discord_id}

**Instructions**:
1. Scan the provided messages for clues about the user's Roblox account.
2. Look for explicit statements like "my user is [name]", "add me: [name]", or ";verify [name]".
3. Distinguish between the user mentioning their own name vs. a friend's name.
4. **Metadata Clues**:
    - **Nick (Nickname)**: Pay close attention to this. Users often format their names as "Rank | Username" in these servers.
    - **Server ID**: Names might be different across different servers, but usually the Roblox identity remains constant.
    - **Chan (Channel)**: Mentions in verification or support channels are high-value evidence.
5. If you find a name, evaluate your confidence (0-100).
6. **ACCURACY IS CRITICAL**: Only claim a username if the context strongly suggests it belongs to the Discord user being analyzed.


**Messages**:
{message_text}

Respond ONLY with valid JSON in this format:
{{
    "discord_id": "{discord_id}",
    "roblox_username": "detected_name_or_null",
    "confidence": number,
    "evidence": "brief explanation of why you chose this name",
    "is_certain": true/false
}}
"""

async def analyze_user(model, discord_id: str, debug: bool = False):
    """Fetch data, prompt AI, and return result."""
    messages = get_user_sample_messages(discord_id)
    if not messages:
        return None
        
    message_text = format_messages_for_ai(messages)
    prompt = create_prompt(discord_id, message_text)
    
    try:
        # Note: In a real async script, we'd use an async AI library if available, 
        # but here we use the synchronous call for simplicity in this script structure.
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if debug:
            print(f"\n--- DEBUG: Raw AI Response for {discord_id} ---")
            print(text)
            print("--- END DEBUG ---\n")
        
        # Strip markdown
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])
            
        return json.loads(text)
    except Exception as e:
        print(f"Error analyzing user {discord_id}: {e}")
        return None


def update_database(results: list, dry_run: bool = False):
    """Update known_users and unknown_users collections."""
    if dry_run:
        print(f"Dry run: Would update {len(results)} records.")
        return

    known_ops = []
    unknown_ops = []
    
    for res in results:
        discord_id = res["discord_id"]
        roblox_name = res["roblox_username"]
        confidence = res["confidence"]
        
        if roblox_name and confidence >= CONFIDENCE_THRESHOLD:
            # Move to Known
            known_ops.append(UpdateOne(
                {"RobloxUsername": roblox_name},
                {
                    "$addToSet": {"DiscordAccounts": {"DiscordUserId": discord_id}},
                    "$set": {"AI_Analyzed": datetime.utcnow(), "AI_Confidence": confidence}
                },
                upsert=True
            ))
            # Delete from unknown just in case
            unknown_ops.append(UpdateOne(
                {"DiscordUserId": discord_id},
                {"$set": {"ProcessedByAI": True, "Status": "Known"}}
            ))
        else:
            # Mark as Unknown
            unknown_ops.append(UpdateOne(
                {"DiscordUserId": discord_id},
                {
                    "$set": {
                        "DiscordUserId": discord_id,
                        "AI_Analyzed": datetime.utcnow(),
                        "ProcessedByAI": True,
                        "Status": "Unknown"
                    }
                },
                upsert=True
            ))

    if known_ops:
        known_users_collection.bulk_write(known_ops)
    if unknown_ops:
        unknown_users_collection.bulk_write(unknown_ops)

def main():
    parser = argparse.ArgumentParser(description="AI Message Identity Extractor")
    parser.add_argument("--limit", type=int, help="Limit number of users to process")
    parser.add_argument("--user", type=str, help="Process a specific Discord ID")
    parser.add_argument("--dry-run", action="store_true", help="Don't save to DB")
    parser.add_argument("--port", type=int, help="MongoDB port")
    parser.add_argument("--debug", action="store_true", help="Show raw AI response")

    
    args = parser.parse_args()
    
    init_mongodb(args.port)
    model = init_gemini()
    
    if args.user:
        target_ids = [args.user]
    else:
        target_ids = get_unique_user_ids(args.limit)
        
    print(f"Total users to analyze: {len(target_ids)}")
    
    results_buffer = []
    
    for i, user_id in enumerate(target_ids):
        print(f"[{i+1}/{len(target_ids)}] Analyzing {user_id}...")
        
        # Run synchronously for simplicity and rate limit control
        result = asyncio.run(analyze_user(model, user_id, debug=args.debug))
        
        if result:
            results_buffer.append(result)
            print(f"  Result: {result.get('roblox_username')} (Conf: {result.get('confidence')}% | Certain: {result.get('is_certain')})")
            if args.debug:
                print(f"  Evidence: {result.get('evidence')}")

        
        if len(results_buffer) >= BATCH_SIZE:
            update_database(results_buffer, args.dry_run)
            results_buffer = []
            
        time.sleep(RATE_LIMIT_DELAY)
        
    if results_buffer:
        update_database(results_buffer, args.dry_run)
        
    print("Processing complete.")

if __name__ == "__main__":
    main()
