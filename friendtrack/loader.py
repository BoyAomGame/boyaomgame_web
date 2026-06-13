"""In-memory store for FriendTrack snapshot files.

A snapshot is one JSON file written at a point in time. We parse every file
into a normalized record and keep them indexed by their ISO timestamp so new
files can be merged in without restarting the server.
"""

import json
import os
from collections import defaultdict
from datetime import datetime, timezone
from threading import RLock


def _coerce_int(value):
    """Best-effort int coercion; returns None on failure or None input."""
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _parse_iso(value):
    """Parse an ISO-ish timestamp into an aware datetime (UTC) for comparison.

    Handles both UTC strings ending in ``Z`` and naive local strings. Naive
    values are assumed to be local wall-clock time; we only use the result for
    ordering, so we attach UTC to keep comparisons total.
    """
    if not value or not isinstance(value, str):
        return None
    text = value.strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class DataStore:
    """Thread-safe in-memory collection of parsed snapshots."""

    def __init__(self):
        # ISO timestamp string -> snapshot record
        self._snapshots = {}
        self._loaded_files = set()
        self._lock = RLock()
        self.last_loaded_file = None
        self.last_loaded_timestamp = None

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------
    def load_directory(self, data_dir):
        """Parse every ``*.json`` file in ``data_dir``. Returns files loaded."""
        if not os.path.isdir(data_dir):
            return 0
        loaded = 0
        for name in sorted(os.listdir(data_dir)):
            if name.lower().endswith(".json"):
                if self.load_file(os.path.join(data_dir, name)):
                    loaded += 1
        return loaded

    def load_file(self, path):
        """Parse a single snapshot file and merge it in. Returns True on success.

        Idempotent: a file with the same snapshot timestamp simply overwrites the
        previous record, so repeated watcher events are harmless.
        """
        name = os.path.basename(path)
        try:
            # utf-8-sig transparently strips a leading BOM (common on Windows-
            # authored files) and behaves like utf-8 when none is present.
            with open(path, "r", encoding="utf-8-sig") as fh:
                raw = json.load(fh)
        except (OSError, json.JSONDecodeError) as exc:
            # File may be mid-write when the watcher fires; a later event reloads it.
            print(f"[FriendTrack] Skipped {name}: {exc}")
            return False

        ts_iso = raw.get("timestamp_iso") or raw.get("timestamp_local") or name
        ts_local = raw.get("timestamp_local") or ts_iso

        entries = []
        for item in raw.get("friend_activity") or []:
            presence = item.get("userPresence") or {}
            entries.append(
                {
                    "user_id": _coerce_int(item.get("id")),
                    "UserPresenceType": presence.get("UserPresenceType"),
                    "lastLocation": presence.get("lastLocation"),
                    "placeId": _coerce_int(presence.get("placeId")),
                    "rootPlaceId": _coerce_int(presence.get("rootPlaceId")),
                    "universeId": _coerce_int(presence.get("universeId")),
                    "gameInstanceId": presence.get("gameInstanceId"),
                    "lastOnline": presence.get("lastOnline"),
                    "sortScore": item.get("sortScore"),
                }
            )

        record = {
            "timestamp_iso": ts_iso,
            "timestamp_local": ts_local,
            "filename": name,
            "entries": entries,
        }

        with self._lock:
            self._snapshots[ts_iso] = record
            self._loaded_files.add(name)
            self.last_loaded_file = name
            self.last_loaded_timestamp = ts_iso
        return True

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------
    def _sorted_snapshots(self, newest_first=True):
        """Snapshots ordered chronologically by parsed timestamp."""
        with self._lock:
            records = list(self._snapshots.values())

        def key(rec):
            dt = _parse_iso(rec["timestamp_iso"])
            # Fall back to lexical order when a timestamp can't be parsed.
            return (
                dt is not None,
                dt or datetime.min.replace(tzinfo=timezone.utc),
                rec["timestamp_iso"],
            )

        records.sort(key=key, reverse=newest_first)
        return records

    def snapshot_count(self):
        with self._lock:
            return len(self._snapshots)

    def get_snapshots(self):
        """All snapshot ISO timestamps, newest first."""
        return [rec["timestamp_iso"] for rec in self._sorted_snapshots(newest_first=True)]

    def get_users(self):
        """All unique user IDs seen across every snapshot, sorted ascending."""
        users = set()
        with self._lock:
            for rec in self._snapshots.values():
                for entry in rec["entries"]:
                    if entry["user_id"] is not None:
                        users.add(entry["user_id"])
        return sorted(users)

    def get_user_history(self, user_id):
        """Presence history for a user, chronological (oldest first)."""
        history = []
        for rec in self._sorted_snapshots(newest_first=False):
            for entry in rec["entries"]:
                if entry["user_id"] == user_id:
                    history.append(
                        {
                            "timestamp": rec["timestamp_iso"],
                            "timestamp_local": rec["timestamp_local"],
                            "UserPresenceType": entry["UserPresenceType"],
                            "lastLocation": entry["lastLocation"],
                            "universeId": entry["universeId"],
                            "gameInstanceId": entry["gameInstanceId"],
                        }
                    )
        return history

    def get_user_latest(self, user_id):
        """Most recent snapshot entry for a user, or None if never seen."""
        for rec in self._sorted_snapshots(newest_first=True):
            for entry in rec["entries"]:
                if entry["user_id"] == user_id:
                    return {
                        "user_id": user_id,
                        "last_seen_timestamp": rec["timestamp_iso"],
                        "UserPresenceType": entry["UserPresenceType"],
                        "lastLocation": entry["lastLocation"],
                        "universeId": entry["universeId"],
                    }
        return None

    def _overlap_for_snapshot(self, rec, universe_filter=None):
        """Group a snapshot's entries by universeId, keeping groups of 2+ users."""
        groups = defaultdict(list)
        locations = {}
        for entry in rec["entries"]:
            universe = entry["universeId"]
            if universe is None:
                continue  # no game = nothing to overlap on
            if universe_filter is not None and universe != universe_filter:
                continue
            uid = entry["user_id"]
            if uid is None:
                continue
            groups[universe].append(uid)
            # Keep the first non-empty location label we see for this universe.
            if not locations.get(universe) and entry["lastLocation"]:
                locations[universe] = entry["lastLocation"]

        events = []
        for universe, uids in groups.items():
            unique = sorted(set(uids))
            if len(unique) >= 2:
                events.append(
                    {
                        "snapshot_timestamp": rec["timestamp_iso"],
                        "universeId": universe,
                        "lastLocation": locations.get(universe),
                        "user_ids": unique,
                    }
                )
        return events

    def get_overlap(self, universe_id):
        """Overlap events for a single universeId, newest first."""
        events = []
        for rec in self._sorted_snapshots(newest_first=True):
            events.extend(self._overlap_for_snapshot(rec, universe_filter=universe_id))
        return events

    def get_overlap_all(self):
        """Overlap events across all universeIds, newest first."""
        events = []
        for rec in self._sorted_snapshots(newest_first=True):
            events.extend(self._overlap_for_snapshot(rec))
        return events
