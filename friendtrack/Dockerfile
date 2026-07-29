FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    FRIENDTRACK_DATA_DIR=/app/data

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py loader.py roblox.py ./
COPY static ./static
COPY data ./data

EXPOSE 8000

CMD ["python", "main.py"]
