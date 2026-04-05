from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import motor.motor_asyncio
import os

app = FastAPI()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client.userlooker

class Message(BaseModel):
    id: str
    user: str
    content: str
    timestamp: datetime

class UserStats(BaseModel):
    user: str
    total_messages: int
    first_seen: datetime
    last_seen: datetime

# Export date filter logic for direct testing and usage
def apply_date_filter(query: dict, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> dict:
    if not date_from and not date_to:
        return query

    if "timestamp" not in query:
        query["timestamp"] = {}

    if date_from:
        query["timestamp"]["$gte"] = date_from
    if date_to:
        query["timestamp"]["$lte"] = date_to

    return query

@app.get("/api/messages")
async def search_messages(
    user: str,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 50
):
    query: Dict[str, Any] = {"user": user}

    # Apply date filters using the logic function
    query = apply_date_filter(query, date_from, date_to)

    messages = await db.messages.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"data": [{"id": str(m["_id"]), "user": m["user"], "content": m["content"], "timestamp": m["timestamp"]} for m in messages]}

@app.get("/api/stats")
async def get_user_stats(user: str):
    pipeline = [
        {"$match": {"user": user}},
        {
            "$group": {
                "_id": "$user",
                "total_messages": {"$sum": 1},
                "first_seen": {"$min": "$timestamp"},
                "last_seen": {"$max": "$timestamp"}
            }
        }
    ]

    cursor = db.messages.aggregate(pipeline)
    stats_list = await cursor.to_list(1)

    if not stats_list:
        raise HTTPException(status_code=404, detail="User not found")

    stats = stats_list[0]
    return {
        "user": stats["_id"],
        "total_messages": stats["total_messages"],
        "first_seen": stats["first_seen"],
        "last_seen": stats["last_seen"]
    }
