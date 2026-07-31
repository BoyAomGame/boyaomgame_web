# boyaomgame_web

This repository contains two services:

- `web`: the Node/Express gateway on port `3000`.
- `friendtrack`: the FastAPI FriendTrack app on port `8000`.

## Run with Docker Compose

```bash
docker compose up --build
```

Then open:

- Express site: <http://localhost:3000>
- Parrot site: <http://parrot.localhost:3000> (the legacy <http://localhost:3000/parrot/> URL also remains available)
- FriendTrack: <http://localhost:8000>

## Parrot subdomain

The Express gateway serves `root/parrot/` as the document root whenever the
request hostname starts with `parrot.`. For production, create a DNS record such
as `parrot.example.com` pointing to the server and configure the reverse proxy to
forward that hostname to port `3000` while preserving the original `Host` header.
No path rewrite is needed.

If Parrot should use a hostname that does not start with `parrot.`, set
`PARROT_HOSTS` to a comma-separated allowlist:

```bash
PARROT_HOSTS=birds.example.com,parrot.internal npm start
```

For a local check, start the gateway and visit `http://parrot.localhost:3000`;
modern browsers resolve `*.localhost` to the loopback address automatically.

Docker Compose uses the following persistent storage:

- `parrot-db`: persists the Parrot SQLite database at `/data/database.sqlite` inside the `web` container.
- `./friendtrack/data`: bind mounts incoming FriendTrack snapshot JSON files at `/app/data` inside the `friendtrack` container, so files dropped into the host directory are picked up live.

Set `FRIENDTRACK_DATA_PATH` before starting Compose to use a different host directory:

```bash
FRIENDTRACK_DATA_PATH=/path/to/friendtrack-data docker compose up --build
```
