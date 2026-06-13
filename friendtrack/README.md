# FriendTrack

A local web dashboard for exploring Roblox friend activity snapshots. Drop JSON snapshot files into a folder and browse them through a clean 3-tab UI — no database, no auth, no build step.

---

## Requirements

- Python 3.10+
- pip
- (Optional) Nginx, if serving behind a reverse proxy

---

## 1. Clone / copy the project

If you're pulling from the main repo:

```bash
git clone https://github.com/BoyAomGame/boyaomgame_web.git
cd boyaomgame_web/friendtrack
```

Or copy just the `friendtrack/` folder to your server and `cd` into it.

---

## 2. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

This installs `fastapi`, `uvicorn[standard]`, and `watchdog`.

---

## 4. Configure the data folder

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` and set the path where snapshot JSON files will be dropped:

```
FRIENDTRACK_DATA_DIR=/home/youruser/friendtrack-data
```

Create that folder if it doesn't exist:

```bash
mkdir -p /home/youruser/friendtrack-data
```

> **Tip:** You can also leave it as `./data` to use the `data/` subfolder inside the project.

---

## 5. Run manually (quick test)

```bash
source .venv/bin/activate
export $(cat .env | xargs)
python main.py
```

The server starts on port `8000`. Open `http://localhost:8000` in your browser.

Expected startup output:

```
[FriendTrack] Loaded 0 snapshot file(s) from /home/youruser/friendtrack-data
[FriendTrack] Watching /home/youruser/friendtrack-data for new .json files
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Drop a `FriendTrack_DDMMYYYY_HHMM.json` file into the data folder and it will be picked up live without a restart.

---

## 6. Run as a systemd service (auto-start on boot)

### Create the service file

```bash
sudo nano /etc/systemd/system/friendtrack.service
```

Paste the following, adjusting paths and username:

```ini
[Unit]
Description=FriendTrack – Roblox Friend Activity Dashboard
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/boyaomgame_web/friendtrack
Environment=FRIENDTRACK_DATA_DIR=/home/youruser/friendtrack-data
ExecStart=/home/youruser/boyaomgame_web/friendtrack/.venv/bin/python main.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Enable and start

```bash
sudo systemctl daemon-reload
sudo systemctl enable friendtrack
sudo systemctl start friendtrack
```

### Check status and logs

```bash
sudo systemctl status friendtrack
sudo journalctl -u friendtrack -f
```

---

## 7. Nginx reverse proxy (optional)

To expose FriendTrack at `https://yourdomain.com/friendtrack/` alongside an existing site, add this to your Nginx server block:

```nginx
# Redirect bare path to trailing-slash (required for relative asset URLs)
location = /friendtrack {
    return 301 /friendtrack/;
}

location /friendtrack/ {
    proxy_pass         http://127.0.0.1:8000/;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
}
```

> All frontend API calls use **relative paths** (`./api/...`) so nothing breaks when the prefix is stripped by `proxy_pass`.

Apply the config:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Snapshot data format

Files must follow the naming pattern:

```
FriendTrack_DDMMYYYY_HHMM.json
```

Expected JSON structure:

```json
{
  "timestamp_local": "2026-04-03 08:00:01",
  "timestamp_iso":   "2026-04-03T08:00:01.418359",
  "friend_activity": [
    {
      "userPresence": {
        "UserPresenceType": "InGame",
        "lastLocation":     "Game Name Here",
        "placeId":          123456,
        "rootPlaceId":      123456,
        "gameInstanceId":   "uuid-string",
        "universeId":       123456,
        "lastOnline":       "2026-04-03T07:59:43.87Z"
      },
      "sortScore": 3008697129060827.0,
      "id": 2584071277
    }
  ]
}
```

Missing or `null` fields are handled gracefully. Both plain UTF-8 and UTF-8 BOM files are accepted.

---

## Project layout

```
friendtrack/
├── main.py          FastAPI app + watchdog file watcher
├── loader.py        JSON parsing + in-memory store
├── requirements.txt Python dependencies
├── .env.example     Sample environment config
├── data/            Default data folder (sample snapshots included)
└── static/
    └── index.html   Entire frontend (vanilla JS + Tailwind CDN)
```

---

## Useful commands

| Task | Command |
|---|---|
| Start manually | `python main.py` |
| Start service | `sudo systemctl start friendtrack` |
| Stop service | `sudo systemctl stop friendtrack` |
| View live logs | `sudo journalctl -u friendtrack -f` |
| Restart after code change | `sudo systemctl restart friendtrack` |
| Test Nginx config | `sudo nginx -t` |
