# Flexbo V2 Non-Dokku Deployment

Flexbo V2 is a clone of the `flexbo-packaging` branch prepared for a non-Dokku deployment at:

- Temporary URL: `http://154.12.245.254/flexbo/`
- App directory on VPS: `/opt/flexbo-V2`
- Media directory on VPS: `/var/www/flexbo-v2/media`
- Environment file: `/etc/flexbo-v2/flexbo.env`
- Node/Express service: `flexbo-v2-node` on `127.0.0.1:18310`
- FastAPI FAQ service: `flexbo-v2-python` on `127.0.0.1:18311`

The public nginx server keeps ports `80/443`; the app services bind only to localhost so they do not conflict with existing apps, mailcow, Postgres, or Docker services.

## Architecture

- React + Vite builds to `dist`.
- Vite production base is `/flexbo/`.
- Node/Express in `server_resend/server.js` serves `dist`, handles `/api/forward`, and proxies chat endpoints to FastAPI.
- FastAPI in `LLM_Bridge/server.py` serves `/api/health` and `/api/chat`.
- nginx maps:
  - `/flexbo/` to Node
  - `/flexbo/api/` to Node API routes
  - `/flexbo/media/` to `/var/www/flexbo-v2/media`

## Local Build Check

```bash
cd /home/gabri/apps-2025/flexbo-V2
npm install
npm run build
```

Production builds should not contain browser calls to `localhost:8000`. The default API path is derived from `import.meta.env.BASE_URL`, so production calls go to `/flexbo/api/...`.

## First VPS Deployment

Run these commands from the local machine unless noted otherwise.

```bash
ssh contabo-night 'sudo install -d -o root -g root -m 755 /etc/flexbo-v2 && sudo install -d -o ubuntu -g ubuntu -m 755 /tmp/flexbo-V2-upload'
rsync -az --delete --exclude .git --exclude node_modules --exclude dist --exclude .venv /home/gabri/apps-2025/flexbo-V2/ contabo-night:/tmp/flexbo-V2-upload/
```

On the target VPS:

```bash
sudo useradd --system --create-home --home-dir /opt/flexbo-home --shell /usr/sbin/nologin flexbo || true
sudo install -d -o flexbo -g flexbo -m 755 /opt/flexbo-V2
sudo rsync -a --delete /tmp/flexbo-V2-upload/ /opt/flexbo-V2/
sudo chown -R flexbo:flexbo /opt/flexbo-V2

sudo install -d -o flexbo -g flexbo -m 755 /var/www/flexbo-v2/media
sudo rsync -a --delete /opt/flexbo-V2/public/media/ /var/www/flexbo-v2/media/
sudo chown -R flexbo:flexbo /var/www/flexbo-v2

sudo tee /etc/flexbo-v2/flexbo.env >/dev/null <<'EOF'
NODE_ENV=production
PORT=18310
HOST=127.0.0.1
PY_BACKEND=http://127.0.0.1:18311
API_KEY=secret
REQUIRE_API_KEY=false
ALLOW_ORIGINS=*
KB_CONFIDENCE=0.25
RESEND_API_KEY=replace_with_resend_key
VITE_API_KEY=secret
EOF
sudo chown root:flexbo /etc/flexbo-v2/flexbo.env
sudo chmod 640 /etc/flexbo-v2/flexbo.env

cd /opt/flexbo-V2
sudo -u flexbo npm ci
sudo -u flexbo npm run build
sudo -u flexbo python3 -m venv .venv
sudo -u flexbo .venv/bin/pip install --upgrade pip
sudo -u flexbo .venv/bin/pip install -r requirements.txt
```

Install services:

```bash
sudo cp /opt/flexbo-V2/deploy/systemd/flexbo-v2-python.service /etc/systemd/system/
sudo cp /opt/flexbo-V2/deploy/systemd/flexbo-v2-node.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now flexbo-v2-python flexbo-v2-node
```

Add nginx routing by inserting the contents of `deploy/nginx/flexbo-v2-location.conf` inside the existing default server block in `/etc/nginx/sites-available/cn-flash-cards`, before the final `include` line.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Verification

```bash
systemctl status flexbo-v2-python --no-pager
systemctl status flexbo-v2-node --no-pager
curl http://127.0.0.1:18311/api/health
curl http://127.0.0.1:18310/api/health
curl -I http://154.12.245.254/flexbo/
curl http://154.12.245.254/flexbo/api/health
curl -I http://154.12.245.254/flexbo/media/Flexbo_Introduction_EN.jpg
```

Email test:

```bash
curl -X POST http://154.12.245.254/flexbo/api/forward \
  -H 'Content-Type: application/json' \
  -d '{"name":"Flexbo V2 test","email":"test@example.com","message":"Deployment test"}'
```

## Updates

```bash
rsync -az --delete --exclude .git --exclude node_modules --exclude dist --exclude .venv /home/gabri/apps-2025/flexbo-V2/ contabo-night:/tmp/flexbo-V2-upload/
ssh contabo-night
sudo rsync -a --delete --exclude node_modules --exclude .venv /tmp/flexbo-V2-upload/ /opt/flexbo-V2/
sudo chown -R flexbo:flexbo /opt/flexbo-V2
cd /opt/flexbo-V2
sudo -u flexbo npm ci
sudo -u flexbo npm run build
sudo -u flexbo .venv/bin/pip install -r requirements.txt
sudo systemctl restart flexbo-v2-python flexbo-v2-node
```

## Rollback

Before replacing `/opt/flexbo-V2`, keep a timestamped copy:

```bash
sudo rsync -a /opt/flexbo-V2/ /opt/flexbo-V2.rollback.$(date +%Y%m%d_%H%M%S)/
```

To roll back:

```bash
sudo systemctl stop flexbo-v2-node flexbo-v2-python
sudo rsync -a --delete /opt/flexbo-V2.rollback.YYYYMMDD_HHMMSS/ /opt/flexbo-V2/
sudo chown -R flexbo:flexbo /opt/flexbo-V2
sudo systemctl start flexbo-v2-python flexbo-v2-node
sudo nginx -t && sudo systemctl reload nginx
```

## Notes

- Do not install or use Dokku for this deployment.
- Do not bind Flexbo directly to public ports.
- Keep `RESEND_API_KEY` only in `/etc/flexbo-v2/flexbo.env`.
- During the final domain migration, update DNS, nginx host routing, and any canonical SEO metadata separately.
