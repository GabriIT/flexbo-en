
# 🧵 Deployment Thread: flexbo-en on Dokku (Buildpacks + Procfile, No Dockerfile)

This markdown documents the full interactive troubleshooting and deployment process for `flexbo-en` using Dokku v0.35.20.

---

## ✅ Initial Setup

- App structure:
  - React + Vite frontend (`src/`)
  - Node.js Express backend (`server_resend/server.js`)
  - Email forwarding via Resend API
  - Static `/media` files mounted on VPS
- Dokku app name: `flexbo-en`
- Deployed on Contabo VPS using Dokku

---

## 🚫 Encountered Issues

### 1. `PR_CONNECT_RESET_ERROR`
- Cause: NGINX config missing
- Symptom: Site showed browser SSL reset error

### 2. `nginx.conf` not generated
- Root Cause: Dokku’s `nginx-vhosts` plugin was silently broken
- Fix: Manually reinstalled plugin from Dokku GitHub

### 3. Builder not selected (`builder selected: empty`)
- Fix:
```bash
dokku builder:set flexbo-en selected herokuish
```

---

## 🛠 Debug + Recovery Steps Summary

```bash
# Reinstall Dokku nginx-vhosts plugin
cd /var/lib/dokku/plugins
sudo mv available/nginx-vhosts available/nginx-vhosts.broken
sudo git clone https://github.com/dokku/dokku.git dokku-core-tmp
sudo cp -r dokku-core-tmp/plugins/nginx-vhosts available/nginx-vhosts
sudo ln -s ../available/nginx-vhosts enabled/nginx-vhosts
sudo rm -rf dokku-core-tmp

# Restart Docker and regenerate NGINX config
sudo systemctl restart docker
dokku proxy:build-config flexbo-en
```

---

## ✅ Final Working Deployment Steps

```bash
# Set up the Dokku app
dokku apps:create flexbo-en
dokku buildpacks:set flexbo-en https://github.com/heroku/heroku-buildpack-nodejs
dokku builder:set flexbo-en selected herokuish

# Ensure Procfile exists in repo root
echo "web: node server_resend/server.js" > Procfile

# Mount media volume
dokku storage:mount flexbo-en /var/lib/dokku/data/storage/flexbo-en-media:/media

# Set proxy port mapping
dokku config:set flexbo-en DOKKU_PROXY_PORT_MAP="http:80:5000 https:443:5000"

# Set environment variables
dokku config:set flexbo-en NODE_ENV=production
dokku config:set flexbo-en RESEND_API_KEY=your_key_here

# Push the app
git push dokku main

# Enable HTTPS
dokku letsencrypt:enable flexbo-en
dokku letsencrypt:cron-job --add
```

---

## ✅ CI/CD Setup (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Dokku
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Push to Dokku
        env:
          DOKKU_HOST: ${{ secrets.DOKKU_HOST }}
          DOKKU_KEY: ${{ secrets.DOKKU_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$DOKKU_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H "$DOKKU_HOST" >> ~/.ssh/known_hosts
          git remote add dokku dokku@$DOKKU_HOST:flexbo-en
          git push dokku main -f
```

---

## ✅ Final Result

- App is accessible at `https://flexbo-en.athenalabo.com`
- SSL is valid and auto-renewing
- `/media` serves assets from persistent VPS folder
- CI/CD enabled via GitHub Actions

---
