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
_TIMEOUT = httpx.Timeout(10.0)

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
        except (httpx.HTTPError, ValueError) as exc:
            print(f"[FriendTrack] Roblox name lookup failed for {len(chunk)} ids: {exc}")
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
        except (httpx.HTTPError, ValueError) as exc:
            print(f"[FriendTrack] Roblox avatar lookup failed for {len(chunk)} ids: {exc}")
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

    if missing:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            names, avatars = await asyncio.gather(
                _fetch_names(client, missing),
                _fetch_avatars(client, missing),
            )
        with _cache_lock:
            for uid in missing:
                name = names.get(uid, {})
                _cache[uid] = {
                    "userId": uid,
                    "username": name.get("username"),
                    "displayName": name.get("displayName"),
                    "avatarUrl": avatars.get(uid),
                }

    with _cache_lock:
        return {str(uid): dict(_cache[uid]) for uid in ids}
