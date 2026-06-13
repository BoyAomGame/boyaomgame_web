"""Roblox profile resolver — turns user IDs into names + avatar thumbnails.

The Roblox name/thumbnail APIs do not send browser-friendly CORS headers, so we
resolve them server-side and cache the results in memory for the process
lifetime (display names and avatars change rarely). Failures degrade
gracefully: a user we can't resolve is returned with null name/avatar so the
frontend can fall back to showing the raw ID.
"""

import asyncio
from threading import Lock

import httpx

_USERS_URL = "https://users.roblox.com/v1/users"
_THUMBS_URL = "https://thumbnails.roblox.com/v1/users/avatar-headshot"
_CHUNK = 100  # Roblox caps both endpoints at 100 IDs per request.
_TIMEOUT = httpx.Timeout(15.0)
# Roblox's edge rejects/severs connections from the default "python-httpx" UA;
# a browser-like User-Agent is required to get past its bot protection.
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

# user_id (int) -> {"userId","username","displayName","avatarUrl"}
_cache = {}
_cache_lock = Lock()


def _chunks(items, size):
    for i in range(0, len(items), size):
        yield items[i : i + size]


async def _fetch_names(client, ids):
    """Return {id: {"username","displayName"}} for the given ids (best effort)."""
    out = {}
    for chunk in _chunks(ids, _CHUNK):
        try:
            resp = await client.post(
                _USERS_URL,
                json={"userIds": chunk, "excludeBannedUsers": False},
            )
            resp.raise_for_status()
            for row in resp.json().get("data", []):
                uid = row.get("id")
                if uid is not None:
                    out[int(uid)] = {
                        "username": row.get("name"),
                        "displayName": row.get("displayName"),
                    }
        except Exception as exc:
            print(f"[FriendTrack] Roblox name lookup failed for {len(chunk)} ids: {exc!r}")
    return out


async def _fetch_avatars(client, ids):
    """Return {id: avatarUrl} for the given ids (best effort)."""
    out = {}
    for chunk in _chunks(ids, _CHUNK):
        try:
            resp = await client.get(
                _THUMBS_URL,
                params={
                    "userIds": ",".join(str(i) for i in chunk),
                    "size": "150x150",
                    "format": "Png",
                    "isCircular": "true",
                },
            )
            resp.raise_for_status()
            for row in resp.json().get("data", []):
                uid = row.get("targetId")
                # Only "Completed" thumbnails have a usable image URL.
                if uid is not None and row.get("state") == "Completed":
                    out[int(uid)] = row.get("imageUrl")
        except Exception as exc:
            print(f"[FriendTrack] Roblox avatar lookup failed for {len(chunk)} ids: {exc!r}")
    return out


async def resolve_profiles(user_ids):
    """Resolve a list of user IDs to profile dicts, using and filling the cache.

    Always returns an entry for every requested ID; unresolved fields are None.
    Keyed by string ID so the result is a ready-to-serialize JSON object.
    """
    ids = sorted({int(u) for u in user_ids if u is not None})
    if not ids:
        return {}

    with _cache_lock:
        missing = [uid for uid in ids if uid not in _cache]

    fetched = {}  # uid -> resolved dict for this call (cached or freshly looked up)
    if missing:
        async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS, follow_redirects=True) as client:
            names, avatars = await asyncio.gather(
                _fetch_names(client, missing),
                _fetch_avatars(client, missing),
            )
        for uid in missing:
            name = names.get(uid, {})
            entry = {
                "userId": uid,
                "username": name.get("username"),
                "displayName": name.get("displayName"),
                "avatarUrl": avatars.get(uid),
            }
            fetched[uid] = entry
            # Only cache successful resolutions, so a transient failure (e.g. a
            # rate-limit or blocked egress) is retried on the next call instead
            # of being remembered as a permanent "unknown".
            if entry["username"] or entry["displayName"] or entry["avatarUrl"]:
                with _cache_lock:
                    _cache[uid] = entry

    def _entry(uid):
        with _cache_lock:
            if uid in _cache:
                return dict(_cache[uid])
        if uid in fetched:
            return dict(fetched[uid])
        return {"userId": uid, "username": None, "displayName": None, "avatarUrl": None}

    return {str(uid): _entry(uid) for uid in ids}
