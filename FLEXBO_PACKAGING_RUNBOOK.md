# Flexbo Packaging Clone + Backup Runbook

Date: 2026-01-11
Host: 209.145.61.113 (dokku 0.35.20)
Operator: ubuntu (sudo)

## Summary of actions
- Created a snapshot backup of `flexbo` (env, nginx, buildpack, ports, storage, repo dir) under `/home/dokku/backups/flexbo-20260110_232252`.
- Removed FAISS mounts from `flexbo` and switched `flexbo` to 301 redirect all traffic to `https://www.flexbo-packaging.com`.
- Configured `flexbo-packaging` to mirror `flexbo` buildpacks, ports, env, and storage (assets only).
- Deployed `flexbo-packaging` from the `flexbo-packaging` branch.
- Enabled Let's Encrypt for `flexbo-packaging.com` + `www.flexbo-packaging.com`.
- Verified health and redirect.

## Backup snapshot (flexbo)
Location:
- `/home/dokku/backups/flexbo-20260110_232252`

Contents:
- `dokku-report.txt`
- `env-export.sh`
- `env-show.txt`
- `domains-report.txt`
- `domains-global-report.txt`
- `urls.txt`
- `buildpacks-report.txt`
- `builder-report.txt`
- `ports-report.txt`
- `proxy-report.txt`
- `nginx-report.txt`
- `nginx.conf`
- `storage-report.txt`
- `storage-list.txt`
- `checks-report.txt`
- `ps-report.txt`
- `git-report.txt`
- `home-dokku-flexbo.tgz` (tar of `/home/dokku/flexbo`)
- `flexbo-en-assets.tgz` (tar of `/var/lib/dokku/data/storage/flexbo-en-assets`)

Note: `tar` reported socket files in the assets directory were skipped (expected).

Latest backup pointer:
- `/home/dokku/backups/flexbo-latest-backup.txt`

## Restore instructions (flexbo)
Use these steps if `flexbo` needs to be restored to the snapshot state.

1) Restore `/home/dokku/flexbo` directory
```bash
sudo -n tar -xzf /home/dokku/backups/flexbo-20260110_232252/home-dokku-flexbo.tgz -C /
```

2) Restore env vars
```bash
# From backup file (review/edit if needed)
cat /home/dokku/backups/flexbo-20260110_232252/env-export.sh

# Example: reapply values (exclude DOKKU_* and GIT_REV if desired)
sudo -n dokku config:set flexbo \
  API_KEY='secret' \
  EMBED_MODEL='nomic-embed-text' \
  ENABLE_WEB_SEARCH='false' \
  FAQ_CONFIDENCE='0.3' \
  FAQ_SIM_THRESHOLD='0.003' \
  NODE_ENV='production' \
  OLLAMA_BASE_URL='http://host.docker.internal:11434' \
  OLLAMA_HOST='http://host.docker.internal:11434' \
  OLLAMA_MODEL='tinyllama:1.1b-chat-v1-q4_0' \
  REQUIRE_API_KEY='true' \
  RESEND_API_KEY='re_PvwxVv9C_DUyvNUseXk7nndAwRwHWzGdH' \
  UVICORN_CMD_ARGS='--lifespan=off' \
  VITE_API_KEY='secret'
```

3) Restore buildpacks and builder
```bash
sudo -n dokku builder:set flexbo selected herokuish
sudo -n dokku buildpacks:clear flexbo
sudo -n dokku buildpacks:set --index 1 flexbo https://github.com/heroku/heroku-buildpack-nodejs
sudo -n dokku buildpacks:add --index 2 flexbo https://github.com/heroku/heroku-buildpack-python
```

4) Restore ports
```bash
sudo -n dokku ports:set flexbo http:80:5000 https:443:5000
```

5) Restore storage mounts
```bash
# Assets mount
sudo -n dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-en-assets:/media

# FAISS mounts (only if you want to restore them)
sudo -n dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-en-faiss:/app/LLM_Bridge/faiss_index
sudo -n dokku storage:mount flexbo /var/lib/dokku/data/storage/flexbo-en-faiss:/faiss
```

6) Restore domains
```bash
sudo -n dokku domains:set flexbo flexbo.athenalabo.com www.flexbo.athenalabo.com
```

7) Restore assets archive (optional)
```bash
sudo -n tar -xzf /home/dokku/backups/flexbo-20260110_232252/flexbo-en-assets.tgz -C /
```

8) Redeploy from git (if needed)
```bash
# From local machine
git remote add dokku dokku@209.145.61.113:flexbo
git push dokku main
```

## Changes applied to flexbo
- Removed FAISS storage mounts:
  - `/var/lib/dokku/data/storage/flexbo-en-faiss:/app/LLM_Bridge/faiss_index`
  - `/var/lib/dokku/data/storage/flexbo-en-faiss:/faiss`
- Added redirect config at `/home/dokku/flexbo/nginx.conf.d/redirect.conf`:
  - `return 301 https://www.flexbo-packaging.com$request_uri;`
- Rebuilt proxy config:
  - `sudo -n dokku proxy:build-config flexbo`

## flexbo-packaging configuration
```bash
# Builder + buildpacks
sudo -n dokku builder:set flexbo-packaging selected herokuish
sudo -n dokku buildpacks:clear flexbo-packaging
sudo -n dokku buildpacks:set --index 1 flexbo-packaging https://github.com/heroku/heroku-buildpack-nodejs
sudo -n dokku buildpacks:add --index 2 flexbo-packaging https://github.com/heroku/heroku-buildpack-python

# Env
sudo -n dokku config:set flexbo-packaging \
  API_KEY='secret' \
  EMBED_MODEL='nomic-embed-text' \
  ENABLE_WEB_SEARCH='false' \
  FAQ_CONFIDENCE='0.3' \
  FAQ_SIM_THRESHOLD='0.003' \
  NODE_ENV='production' \
  OLLAMA_BASE_URL='http://host.docker.internal:11434' \
  OLLAMA_HOST='http://host.docker.internal:11434' \
  OLLAMA_MODEL='tinyllama:1.1b-chat-v1-q4_0' \
  REQUIRE_API_KEY='true' \
  RESEND_API_KEY='re_PvwxVv9C_DUyvNUseXk7nndAwRwHWzGdH' \
  UVICORN_CMD_ARGS='--lifespan=off' \
  VITE_API_KEY='secret'

# Domains
sudo -n dokku domains:set flexbo-packaging flexbo-packaging.com www.flexbo-packaging.com

# Ports
sudo -n dokku ports:set flexbo-packaging http:80:5000 https:443:5000

# Storage
sudo -n dokku storage:mount flexbo-packaging /var/lib/dokku/data/storage/flexbo-en-assets:/media

# Deploy (local)
git push dokku flexbo-packaging:main

# Letsencrypt
sudo -n dokku letsencrypt:set flexbo-packaging email admin@athenalabo.com
sudo -n dokku letsencrypt:enable flexbo-packaging
sudo -n dokku letsencrypt:cron-job --add
```

## Validation checks
```bash
curl -I https://flexbo-packaging.com
curl https://flexbo-packaging.com/api/health

curl -I http://flexbo.athenalabo.com
curl -I https://flexbo.athenalabo.com
```
