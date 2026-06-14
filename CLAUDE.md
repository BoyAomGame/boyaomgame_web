# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Big picture

This repo hosts **two independent services** that share a domain via a reverse proxy but do not talk to each other. PM2 (`ecosystem.config.js`) runs both:

1. **Express gateway** (`server.js`, process `MainNodeServer`, Node, port **3000**) — serves all static files out of `root/` and hosts the Parrot blog/admin API under `/api/*`.
2. **FriendTrack** (`friendtrack/main.py`, process `FriendTrack`, FastAPI/Python, port **8000**) — a self-contained dashboard for exploring Roblox friend-activity snapshots. Has its own frontend (`friendtrack/static/index.html`) and `/api/*` namespace, unrelated to the Express `/api`.

In production an external Nginx puts FriendTrack at `/friendtrack/` (prefix stripped via `proxy_pass http://127.0.0.1:8000/;`) alongside the Express site at `/`. The two services are wired together only at the proxy layer.

### Express gateway + Parrot

- `app.use(express.static('root'))` serves everything in `root/`, so `root/parrot/index.html` is reachable at `/parrot/`.
- The Parrot router (`website_sys/parrot_system/router.js`) is mounted at `/api`.
- **Datastore:** SQLite (`website_sys/parrot_system/database.sqlite`, gitignored). Schema (`posts`, `users`) is auto-created on connect in `database.js`, which seeds a default `admin`/`password` user when the table is empty. Auth is session-based (`req.session.isAdmin`).
- **Security-sensitive endpoints** in `router.js`: `POST /api/login` and `POST /api/sql` (admin-gated) execute SQL against the DB; `/api/sql` runs arbitrary queries. Treat both with care.

### FriendTrack

A snapshot viewer with **no database and no auth** — everything lives in memory.

- **Ingestion is folder-driven.** `main.py` runs a `watchdog` observer over `FRIENDTRACK_DATA_DIR` (default `./data`). Dropping a `*.json` file in is parsed and merged live, no restart. `loader.py:DataStore` holds parsed snapshots keyed by ISO timestamp; re-merging the same timestamp is idempotent.
- **Snapshot files** follow `FriendTrack_DDMMYYYY_HHMM.json` and contain a `friend_activity[]` array (see `friendtrack/README.md` §8 for the schema). Files may be read mid-write — parse failures are logged and retried on the next watcher event. UTF-8 BOM is tolerated (`utf-8-sig`).
- **Timestamps:** naive snapshot timestamps are treated as **UTC** (the capture VPS runs in UTC). `loader.py` emits `timestamp_utc` (explicit `+00:00`) so the frontend renders in the viewer's local timezone.
- **Roblox resolver** (`roblox.py`): turns user IDs into `{username, displayName, avatarUrl}` server-side (the Roblox name/thumbnail APIs send no CORS headers). Results are cached in-process for the process lifetime; only *successful* resolutions are cached so transient failures retry. **A browser-like `User-Agent` is mandatory** — Roblox's edge severs connections from the default `python-httpx` UA. Unresolved IDs degrade to null fields so the frontend can fall back to the raw ID.
- **Subpath-safe:** all backend routes are root-relative and the frontend uses relative `./api/...` paths, so the Nginx prefix strip leaves everything working.

## Commands

All commands run from the repo root unless noted. Local environment is Windows (PowerShell), but PM2/venv paths in `ecosystem.config.js` target the Linux production host.

### Running everything (production)

```
pm2 start ecosystem.config.js      # starts MainNodeServer (:3000) + FriendTrack (:8000)
```

The FriendTrack PM2 entry hardcodes a Linux interpreter path (`/var/www/boyaomgame_web/friendtrack/.venv/bin/python`); adjust for local runs.

### Express gateway (local dev)

```
npm start                          # Express gateway on :3000
```

### FriendTrack (local dev)

```
cd friendtrack
python -m venv .venv               # first time only
.\.venv\Scripts\Activate.ps1       # PowerShell; use `source .venv/bin/activate` on Linux
pip install -r requirements.txt    # fastapi, uvicorn[standard], watchdog, httpx
python main.py                     # serves on :8000 (override with PORT / FRIENDTRACK_DATA_DIR)
```

### Tests

There is no test suite. Root `npm test` is a placeholder that exits 1. FriendTrack ships a `_smoketest.py` but no formal test runner. Do not assume tests exist.

## Conventions & gotchas

- **`root/` holds hand-authored static HTML** — `root/parrot/` and other `root/` files are edited directly.
- **FriendTrack's entire frontend is one file** (`friendtrack/static/index.html`, vanilla JS + Tailwind CDN, no build step).
- **The two `/api` namespaces are unrelated** — Express's `/api/*` (Parrot, :3000) vs FriendTrack's `/api/*` (:8000). Don't conflate them.
- The Express session secret in `server.js` is hardcoded; the sensitive surface is the Parrot login and `POST /api/sql`.
