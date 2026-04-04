import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime

# Import the FastAPI app
from main import app, get_db

client = TestClient(app)

@pytest.fixture
def mock_db():
    with patch('main.get_db') as mock:
        mock_client = MagicMock()
        mock.return_value = mock_client
        yield mock_client

def test_search_messages_basic(mock_db):
    """Test the basic search messages endpoint functionality with just the user parameter."""
    # Setup mock return value
    mock_db.messages.find.return_value = [
        {"id": "1", "content": "hello", "timestamp": datetime(2023, 1, 1), "user": "testuser"}
    ]

    # Send request
    response = client.get("/api/messages?user=testuser")

    assert response.status_code == 200

    # The tests should assert what the AI needs to implement correctly
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "1"
    assert data[0]["content"] == "hello"
    assert data[0]["user"] == "testuser"

def test_search_messages_date_filter(mock_db):
    """Test the search messages endpoint with date_filter functionality."""
    # Setup mock return value
    mock_db.messages.find.return_value = [
        {"id": "2", "content": "hello later", "timestamp": datetime(2023, 2, 1), "user": "testuser"}
    ]

    # Send request with date filters
    response = client.get("/api/messages?user=testuser&date_from=2023-01-15T00:00:00&date_to=2023-02-15T00:00:00")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "2"

def test_search_messages_invalid_date():
    """Test the search messages endpoint with invalid date format."""
    response = client.get("/api/messages?user=testuser&date_from=invalid-date")
    assert response.status_code == 422 # FastAPI validation error

def test_get_user_stats(mock_db):
    """Test the get_user_stats endpoint functionality."""
    # Setup mock return value
    mock_db.user_stats.find_one.return_value = {
        "user": "testuser",
        "message_count": 42,
        "first_seen": datetime(2022, 1, 1),
        "last_seen": datetime(2023, 1, 1)
    }

    response = client.get("/api/user_stats?user=testuser")

    assert response.status_code == 200
    data = response.json()
    assert data["user"] == "testuser"
    assert data["message_count"] == 42
    assert "first_seen" in data
    assert "last_seen" in data

def test_get_user_stats_missing_user():
    """Test the get_user_stats endpoint with missing user parameter."""
    response = client.get("/api/user_stats")
    assert response.status_code == 422 # FastAPI validation error

def test_get_db_coverage():
    """Test get_db to increase coverage since we mock it everywhere else."""
    db = get_db()
    assert db is not None
    assert db.messages.find() == []
    assert db.user_stats.find_one()["user"] == "default"
