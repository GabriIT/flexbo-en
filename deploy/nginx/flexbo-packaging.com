server {
    listen 80;
    listen [::]:80;

    server_name flexbo-packaging.com www.flexbo-packaging.com *.flexbo-packaging.com;

    return 301 https://www.flexbo-packaging.com$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name flexbo-packaging.com;

    ssl_certificate /etc/letsencrypt/live/flexbo-packaging.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flexbo-packaging.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://www.flexbo-packaging.com$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name www.flexbo-packaging.com;

    ssl_certificate /etc/letsencrypt/live/flexbo-packaging.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flexbo-packaging.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:18320/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    location /media/ {
        alias /var/www/flexbo-domain/media/;
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    location / {
        proxy_pass http://127.0.0.1:18320/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
