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
- FriendTrack: <http://localhost:8000>

Docker Compose uses the following persistent storage:

- `parrot-db`: persists the Parrot SQLite database at `/data/database.sqlite` inside the `web` container.
- `./friendtrack/data`: bind mounts incoming FriendTrack snapshot JSON files at `/app/data` inside the `friendtrack` container, so files dropped into the host directory are picked up live.

Set `FRIENDTRACK_DATA_PATH` before starting Compose to use a different host directory:

```bash
FRIENDTRACK_DATA_PATH=/path/to/friendtrack-data docker compose up --build
```
