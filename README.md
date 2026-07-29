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

Docker Compose creates two named volumes:

- `parrot-db`: persists the Parrot SQLite database at `/data/database.sqlite` inside the `web` container.
- `friendtrack-data`: persists FriendTrack snapshot JSON files at `/app/data` inside the `friendtrack` container.
