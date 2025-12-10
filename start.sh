#!/usr/bin/env bash
set -euo pipefail

# Build frontend if dist doesn't exist
if [ ! -d "dist" ]; then
  echo "[start.sh] Building frontend..."
  npm run build
fi

# Start FastAPI on localhost:8000 in background
python3 -m uvicorn LLM_Bridge.server:app --host=127.0.0.1 --port=8000 &

# Start Express in foreground on $PORT (Dokku sets PORT, usually 5000)
exec node server_resend/server.js
