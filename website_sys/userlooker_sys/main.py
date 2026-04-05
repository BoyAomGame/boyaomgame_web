from fastapi import FastAPI, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class Message(BaseModel):
    id: str
    content: str
    timestamp: datetime
    user: str

class UserStats(BaseModel):
    user: str
    message_count: int
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None

# Dummy DB connection for mocking
def get_db():
    class DummyMessages:
        def find(self, *args, **kwargs):
            return []
    class DummyStats:
        def find_one(self, *args, **kwargs):
            return {"user": "default", "message_count": 0}

    class DummyDB:
        messages = DummyMessages()
        user_stats = DummyStats()
    return DummyDB()

@app.get("/api/messages", response_model=List[Message])
async def search_messages(
    user: str,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None)
):
    db = get_db()

    # Simple mocked implementation to pass tests initially for the AI test runner
    # The AI should implement real MongoDB logic
    mocked_data = db.messages.find()

    result = []
    for item in mocked_data:
        result.append(Message(
            id=item["id"],
            content=item["content"],
            timestamp=item["timestamp"],
            user=item["user"]
        ))

    return result

@app.get("/api/user_stats", response_model=UserStats)
async def get_user_stats(user: str):
    db = get_db()

    # Simple mocked implementation to pass tests initially
    # The AI should implement real MongoDB logic
    mocked_data = db.user_stats.find_one()

    return UserStats(
        user=user,
        message_count=mocked_data.get("message_count", 0),
        first_seen=mocked_data.get("first_seen"),
        last_seen=mocked_data.get("last_seen")
    )
