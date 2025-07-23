Running the code:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

---

## Project Description

- A Flexbo website, dokku deployed flexbo-en with persistent storage
- Server backend in Go to manage Postgresql db
- server_resend is a Express server to forward email from the website

-Added Procfile to run in container server_resend/forward.js
-Both server_resend and media are served through buildpack node

# Pending

-For Server, Go App for Postgresql I will need to add it as well

# Why using nginx.conf

nginx.conf followed by a line-by-line breakdown.
(The comments that start with # are only for you and are not part of the file.)
server {
listen 80; # ①
server*name *; # ②

    root /usr/share/nginx/html;         # ③
    index index.html;                   # ④

    # Serve user-uploaded images / videos
    location /media/ {                  # ⑤
        try_files $uri $uri/ =404;      # ⑥
    }

    # React-Router / SPA fallback
    location / {                        # ⑦
        try_files $uri /index.html;     # ⑧
    }

    # Security header example
    add_header X-Content-Type-Options nosniff;   # ⑨

}

#

Directive
Purpose
①
listen 80;
Tells Nginx to accept HTTP requests on port 80 inside the container (Dokku will map that to whichever external port is exposed).
②
server*name *;
The underscore is a catch-all value. Inside a Dokku container you normally don’t know the public hostname, so this ensures the block responds to any Host header.
③
root /usr/share/nginx/html;
Sets the document-root to the directory where the Dockerfile copied the Vite build output. All static paths are resolved relative to here unless another root or alias overrides them.
④
index index.html;
If the request is / (no file), Nginx will try to serve index.html in the root directory.
⑤
location /media/ { ... }
This block handles every URL that starts with /media/. By mounting your persistent volume at /usr/share/nginx/html/media, user uploads immediately appear under this path.
⑥
try_files $uri $uri/ =404;
Attempt 1: Serve the exact file ($uri). Attempt 2: If the request ends without a trailing slash but there’s a matching directory, serve its index (rare for media). Fail: return 404 so a missing image doesn’t fall through to the SPA handler.
⑦
location / { ... }
This is the “catch-all” for everything else (JavaScript, CSS, JSON, regular page paths, etc.).
⑧
try_files $uri /index.html;
Static first: If the requested file exists (e.g. /favicon.svg, /assets/index-abc123.js), serve it. Otherwise: return index.html so a client-side-routed path like /dashboard still loads the React app and lets React Router display the correct page. Without this fallback, refreshing a deep link would give a 404.
⑨
add_header X-Content-Type-Options nosniff;
Simple security hardening: stops certain MIME-type guessing attacks by telling browsers to trust the declared Content-Type. You can add further headers (HSTS, CSP, etc.) as needed.

Why you need a custom nginx.conf in this setup 1. Single-Page-Application routing
Vite’s build creates an index.html entry point plus hashed asset files. React Router uses the browser’s History API, so URLs like /about never hit the server in dev mode. In production, Nginx must map every unknown path back to index.html (lines ⑦-⑧). The default Nginx config does not include that fallback, so deep links would 404 without this file. 2. Separate persistent media folder
You told Dokku to mount /var/lib/dokku/data/storage/flexbo-en-assets ⇒ /usr/share/nginx/html/media.
The custom location /media/ (lines ⑤-⑥) ensures:
◦ It’s served efficiently as static files.
◦ Missing images return 404 instead of falling into the SPA handler (which would otherwise return index.html and mis-lead the browser). 3. Prevent accidental overwrites
Because the built bundle also lives under /usr/share/nginx/html, you want user uploads kept in their own path (/media) to avoid name clashes with /assets or root-level files. Having that dedicated location block isolates them. 4. Ability to add headers / tuning now or later
A custom file is your hook to add compression, cache policies, CORS, rate limits, WebSocket upgrades for the Go backend (if you later reverse-proxy it), etc. It’s future-proofing.
If you relied on the Nginx defaults, only the first request to / would work; every other client-side route would fail, and your uploads directory might not be exposed at all.
