"""FriendTrack — FastAPI app + watchdog folder watcher.

Serves the single-page frontend at ``/`` and a small REST API under ``/api``.
Designed to also run behind an Nginx reverse proxy at the ``/friendtrack/``
subpath: all backend routes are root-relative and the frontend uses relative
paths, so stripping the prefix in Nginx (``proxy_pass http://host:8000/;``)
keeps everything working.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from loader import DataStore

DATA_DIR = os.environ.get("FRIENDTRACK_DATA_DIR", "./data")
PORT = int(os.environ.get("PORT", "8000"))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
INDEX_FILE = os.path.join(STATIC_DIR, "index.html")

store = DataStore()


class SnapshotEventHandler(FileSystemEventHandler):
    """Reloads a snapshot file whenever it appears or changes in the data dir."""

    def _handle(self, path):
        if path and path.lower().endswith(".json"):
            if store.load_file(path):
                print(f"[FriendTrack] Merged snapshot: {os.path.basename(path)}")

    def on_created(self, event):
        if not event.is_directory:
            self._handle(event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._handle(event.src_path)

    def on_moved(self, event):
        # Atomic writes often land as a rename from a temp file into place.
        if not event.is_directory:
            self._handle(getattr(event, "dest_path", None))


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(DATA_DIR, exist_ok=True)
    loaded = store.load_directory(DATA_DIR)
    print(f"[FriendTrack] Loaded {loaded} snapshot file(s) from {os.path.abspath(DATA_DIR)}")

    observer = Observer()
    observer.schedule(SnapshotEventHandler(), DATA_DIR, recursive=False)
    observer.start()
    print(f"[FriendTrack] Watching {os.path.abspath(DATA_DIR)} for new .json files")

    try:
        yield
    finally:
        observer.stop()
        observer.join()


app = FastAPI(title="FriendTrack", lifespan=lifespan)


# ----------------------------------------------------------------------
# Frontend
# ----------------------------------------------------------------------
@app.get("/")
def index():
    if not os.path.exists(INDEX_FILE):
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(INDEX_FILE)


# ----------------------------------------------------------------------
# API
# ----------------------------------------------------------------------
@app.get("/api/snapshots")
def api_snapshots():
    """Snapshot timestamps (newest first) plus header metadata."""
    snapshots = store.get_snapshots()
    return {
        "count": len(snapshots),
        "snapshots": snapshots,
        "last_loaded_file": store.last_loaded_file,
        "last_loaded_timestamp": store.last_loaded_timestamp,
    }


@app.get("/api/users")
def api_users():
    return store.get_users()


@app.get("/api/user/{user_id}/history")
def api_user_history(user_id: int):
    return store.get_user_history(user_id)


@app.get("/api/user/{user_id}/latest")
def api_user_latest(user_id: int):
    latest = store.get_user_latest(user_id)
    if latest is None:
        raise HTTPException(status_code=404, detail="User not found in any snapshot")
    return latest


@app.get("/api/overlap")
def api_overlap(universeId: int = Query(..., description="Universe ID to inspect")):
    return store.get_overlap(universeId)


@app.get("/api/overlap/all")
def api_overlap_all():
    return store.get_overlap_all()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)
