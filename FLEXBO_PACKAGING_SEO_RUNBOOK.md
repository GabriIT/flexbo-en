# Flexbo Packaging SEO Migration Runbook

Date: 2026-01-11
Canonical domain: https://www.flexbo-packaging.com

## Summary of changes (implemented)
1) Canonical host enforcement at Nginx for `flexbo-packaging` (all hosts -> www).
2) Old domain redirect on `flexbo` app (preserves path/query).
3) Sitemap updated to the new canonical domain.
4) Robots file updated and `robots.txt` added.
5) Canonical + OG URLs updated in pages with `<Helmet>`.
6) Internal text reference updated in About page.
7) Resend `from:` address updated to noreply@flexbo-packaging.com (already present).
8) Deployed and validated redirects + sitemap/robots endpoints.

## VPS changes (Dokku)

### A) Canonical host redirect on flexbo-packaging
Creates a server-side 301 to canonical host.

```bash
sudo -n mkdir -p /home/dokku/flexbo-packaging/nginx.conf.d
sudo -n tee /home/dokku/flexbo-packaging/nginx.conf.d/00-canonical-host.conf > /dev/null <<'CONF'
# Force canonical host for SEO (preserve path + query)
set $canonical_host 0;
if ($host = "www.flexbo-packaging.com") {
  set $canonical_host 1;
}
if ($canonical_host = 0) {
  return 301 https://www.flexbo-packaging.com$request_uri;
}
CONF
sudo -n chown -R dokku:dokku /home/dokku/flexbo-packaging/nginx.conf.d
sudo -n dokku proxy:build-config flexbo-packaging
```

### B) Old domain redirect on flexbo (athenalabo -> packaging)
Preserves paths for SEO migration.

```bash
sudo -n mkdir -p /home/dokku/flexbo/nginx.conf.d
sudo -n tee /home/dokku/flexbo/nginx.conf.d/redirect.conf > /dev/null <<'CONF'
return 301 https://www.flexbo-packaging.com$request_uri;
CONF
sudo -n dokku proxy:build-config flexbo
```

## Repo changes (canonical URLs + SEO assets)

### A) Sitemap updated
`public/sitemap.xml` now uses `https://www.flexbo-packaging.com` for all `<loc>` values and updated `lastmod` to `2026-01-11`.

### B) Robots file
- `public/robot.txt` updated
- Added `public/robots.txt` (canonical path for crawlers)

Content:
```
User-agent: *
Allow: /

Sitemap: https://www.flexbo-packaging.com/sitemap.xml
```

### C) Canonical tags updated
Updated `SITE_ORIGIN` in:
- `src/pages/About.tsx`
- `src/pages/Products.tsx`
- `src/pages/ProductDetail.tsx`

### D) Email sender domain
`server_resend/api/forward.js` uses:
```
from: 'Website <noreply@flexbo-packaging.com>'
```

## Deploy commands
```bash
# From local repo

git push origin flexbo-packaging

git push dokku flexbo-packaging:main
```

## Verification checks (run after deploy)
```bash
# Non-www -> www
curl -I https://flexbo-packaging.com/about

# Old domain -> new domain (path preserved)
curl -I https://flexbo.athenalabo.com/about

# Canonical pages
curl -I https://www.flexbo-packaging.com/about
curl -I https://www.flexbo-packaging.com/robots.txt
curl -I https://www.flexbo-packaging.com/sitemap.xml
```

Expected:
- Non-www and old domain: 301 -> `https://www.flexbo-packaging.com/...`
- Canonical pages: 200

## Google Search Console (manual)
1) Verify `flexbo-packaging.com` (Domain property recommended).
2) Submit `https://www.flexbo-packaging.com/sitemap.xml`.
3) Keep `flexbo.athenalabo.com` property verified.
4) Use **Change of Address** from old to new domain.
5) Inspect and request indexing for top landing pages.
6) Keep redirects active for 12+ months.

## Bing Webmaster Tools (manual)
1) Verify `flexbo-packaging.com`.
2) Submit `https://www.flexbo-packaging.com/sitemap.xml`.
3) Use **Site Move** if available (or URL Submission for key pages).
4) Monitor crawl errors and index coverage.

## Notes
- The old GSC verification file in `public/` stays for the old domain.
- Add new verification files from Google/Bing when provided.
