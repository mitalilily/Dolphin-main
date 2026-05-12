#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/dolphin}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-shopnship.in}"
MARKETING_DOMAINS="${MARKETING_DOMAINS:-$PRIMARY_DOMAIN www.$PRIMARY_DOMAIN}"
CLIENT_DOMAIN="${CLIENT_DOMAIN:-app.$PRIMARY_DOMAIN}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.$PRIMARY_DOMAIN}"
API_DOMAIN="${API_DOMAIN:-api.$PRIMARY_DOMAIN}"
API_ORIGIN="${API_ORIGIN:-https://$API_DOMAIN}"
API_PORT="${API_PORT:-5002}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/dolphin}"
SSL_CERT_NAME="${SSL_CERT_NAME:-$PRIMARY_DOMAIN}"
SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/letsencrypt/live/$SSL_CERT_NAME/fullchain.pem}"
SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/letsencrypt/live/$SSL_CERT_NAME/privkey.pem}"

SSL_LISTEN=""
SSL_DIRECTIVES=""
if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
  SSL_LISTEN="    listen 443 ssl http2;
    listen [::]:443 ssl http2;"
  SSL_DIRECTIVES="    ssl_certificate $SSL_CERT_PATH;
    ssl_certificate_key $SSL_KEY_PATH;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;"
fi

mkdir -p "$(dirname "$NGINX_SITE")"

cat > "$NGINX_SITE" <<'EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    listen [::]:80;
__SSL_LISTEN__
    server_name __API_DOMAIN__;
__SSL_DIRECTIVES__

    client_max_body_size 50m;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    location /api/ {
        proxy_pass http://127.0.0.1:__API_PORT__/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:__API_PORT__/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /pgadmin/ {
        proxy_pass http://127.0.0.1:5050/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Script-Name /pgadmin;
        proxy_set_header X-Scheme $scheme;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_redirect off;
    }

    location /health {
        proxy_pass http://127.0.0.1:__API_PORT__/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:__API_PORT__;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
__SSL_LISTEN__
    server_name __ADMIN_DOMAIN__;
__SSL_DIRECTIVES__

    root __APP_DIR__/apps/admin/build;
    index index.html;
    client_max_body_size 50m;

    location /api/ {
        return 308 __API_ORIGIN__$request_uri;
    }

    location /socket.io/ {
        return 308 __API_ORIGIN__$request_uri;
    }

    location /static/ {
        try_files $uri =404;
        access_log off;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = / {
        return 302 /admin/dashboard;
    }

    location / {
        add_header Clear-Site-Data "\"cache\"";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri /index.html;
    }
}

server {
    listen 80;
    listen [::]:80;
__SSL_LISTEN__
    server_name __CLIENT_DOMAIN__;
__SSL_DIRECTIVES__

    root __APP_DIR__/apps/client/dist-app;
    index index.html;
    client_max_body_size 50m;

    location /api/ {
        return 308 __API_ORIGIN__$request_uri;
    }

    location /socket.io/ {
        return 308 __API_ORIGIN__$request_uri;
    }

    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location / {
        add_header Clear-Site-Data "\"cache\"";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
__SSL_LISTEN__
    server_name __MARKETING_DOMAINS__;
__SSL_DIRECTIVES__

    root __APP_DIR__/apps/client/dist-marketing;
    index index.html;
    client_max_body_size 50m;

    location /api/ {
        return 308 __API_ORIGIN__$request_uri;
    }

    location /socket.io/ {
        return 308 __API_ORIGIN__$request_uri;
    }

    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location / {
        add_header Clear-Site-Data "\"cache\"";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri $uri/ /index.html;
    }
}
EOF

escape_sed_replacement() {
  printf '%s' "$1" | sed -e 's/[&@]/\\&/g'
}

sed -i "s@__APP_DIR__@$(escape_sed_replacement "$APP_DIR")@g" "$NGINX_SITE"
sed -i "s@__PRIMARY_DOMAIN__@$(escape_sed_replacement "$PRIMARY_DOMAIN")@g" "$NGINX_SITE"
sed -i "s@__MARKETING_DOMAINS__@$(escape_sed_replacement "$MARKETING_DOMAINS")@g" "$NGINX_SITE"
sed -i "s@__CLIENT_DOMAIN__@$(escape_sed_replacement "$CLIENT_DOMAIN")@g" "$NGINX_SITE"
sed -i "s@__ADMIN_DOMAIN__@$(escape_sed_replacement "$ADMIN_DOMAIN")@g" "$NGINX_SITE"
sed -i "s@__API_DOMAIN__@$(escape_sed_replacement "$API_DOMAIN")@g" "$NGINX_SITE"
sed -i "s@__API_ORIGIN__@$(escape_sed_replacement "$API_ORIGIN")@g" "$NGINX_SITE"
sed -i "s@__API_PORT__@$(escape_sed_replacement "$API_PORT")@g" "$NGINX_SITE"

replace_multiline_placeholder() {
  local placeholder="$1"
  local value="$2"
  PLACEHOLDER="$placeholder" REPLACEMENT="$value" perl -0pi -e 's/\Q$ENV{PLACEHOLDER}\E/$ENV{REPLACEMENT}/g' "$NGINX_SITE"
}

replace_multiline_placeholder "__SSL_LISTEN__" "$SSL_LISTEN"
replace_multiline_placeholder "__SSL_DIRECTIVES__" "$SSL_DIRECTIVES"
