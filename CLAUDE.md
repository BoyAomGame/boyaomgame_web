# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Big picture

This is a static site served behind a single Node/Express front door, with one small dynamic module mounted into it:

1. **Express gateway** (`server.js`) — the only public-facing process. Serves all static files out of `root/` and hosts the Parrot API under `/api/*`.
2. **Parrot system** (`website_sys/parrot_system/`) — a small Node/SQLite blog/admin module mounted into the Express gateway. Its static frontend is plain HTML under `root/parrot/`.

### Request routing

- The Express gateway listens on `PORT` (default **3000**) and is the production entry point.
- `app.use(express.static('root'))` serves everything in `root/`, so `root/parrot/index.html` is reachable at `/parrot/`.
- The Parrot router is mounted under `/api` (`app.use('/api', parrotRouter)`).

### Datastore

- **Parrot** uses SQLite (`website_sys/parrot_system/database.sqlite`, gitignored). Schema (`posts`, `users`) is auto-created on connect in `database.js`, which also seeds a default `admin`/`password` user if the table is empty. Auth is Express **session-based** (`req.session.isAdmin`).

## Commands

All commands run from the repo root unless noted. This is a Windows environment (PowerShell).

### Running the server

In production the process is managed by PM2 via `ecosystem.config.js`:
```
pm2 start ecosystem.config.js     # starts MainNodeServer (server.js)
```

For manual/local dev:
```
npm start                          # Express gateway on :3000
```

### Tests
There is no test suite. Root `npm test` is a placeholder that exits 1. Do not assume tests exist.

## Conventions & gotchas

- **`root/` holds hand-authored static HTML** — `root/parrot/` and other `root/` files are edited directly.
- **The Parrot login and the raw-SQL endpoint** (`POST /api/sql`, admin-gated by session) execute arbitrary SQL against the SQLite DB — treat with care.
