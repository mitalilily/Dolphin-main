#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/dolphin}"
REPO_URL="${REPO_URL:-https://github.com/mitalilily/Dolphin-main.git}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-shopnship.in}"
CLIENT_DOMAIN="${CLIENT_DOMAIN:-client.$PRIMARY_DOMAIN}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.$PRIMARY_DOMAIN}"
DOMAIN_NAMES="${DOMAIN_NAMES:-$PRIMARY_DOMAIN www.$PRIMARY_DOMAIN app.$PRIMARY_DOMAIN $CLIENT_DOMAIN $ADMIN_DOMAIN}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://$PRIMARY_DOMAIN}"
CLIENT_ORIGIN="${CLIENT_ORIGIN:-https://$CLIENT_DOMAIN}"
ADMIN_ORIGIN="${ADMIN_ORIGIN:-https://$ADMIN_DOMAIN}"
API_ORIGIN="${API_ORIGIN:-$PUBLIC_ORIGIN}"
API_PORT="${API_PORT:-5002}"
PGADMIN_EMAIL="${PGADMIN_EMAIL:-admin@$PRIMARY_DOMAIN}"
PGADMIN_PASSWORD="${PGADMIN_PASSWORD:-ChangeThisPgAdminPassword123!}"
BACKEND_ENV_SOURCE="${BACKEND_ENV_SOURCE:-/root/dolphin-backend.env}"
ENABLE_SSL="${ENABLE_SSL:-true}"
SSL_EMAIL="${SSL_EMAIL:-admin@$PRIMARY_DOMAIN}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git gnupg nginx ufw

install -d -m 0755 /usr/share/postgresql-common/pgdg
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | gpg --dearmor --yes -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg] https://apt.postgresql.org/pub/repos/apt jammy-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list
apt-get update
apt-get install -y postgresql-client-16

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -Eq '^v20\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

mkdir -p /var/www /etc/dolphin /opt/pgadmin

if [ ! -d "$APP_DIR/.git" ]; then
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

if [ ! -f "$BACKEND_ENV_SOURCE" ]; then
  DOMAIN_ORIGINS=""
  for domain in $DOMAIN_NAMES; do
    DOMAIN_ORIGINS="${DOMAIN_ORIGINS},https://${domain},http://${domain}"
  done
  CORS_ORIGIN_LIST="${CORS_ORIGIN_LIST:-${PUBLIC_ORIGIN},${PUBLIC_ORIGIN}/admin${DOMAIN_ORIGINS}}"

  cat > "$BACKEND_ENV_SOURCE" <<EOF
NODE_ENV=production
PORT=${API_PORT}
DATABASE_URL=
PGSSLMODE=require
CORS_ALLOWED_ORIGINS=${CORS_ORIGIN_LIST}
CORS_ORIGINS=${CORS_ORIGIN_LIST}
FRONTEND_URL=${PUBLIC_ORIGIN}
API_URL=${API_ORIGIN}
EOF
  chmod 600 "$BACKEND_ENV_SOURCE"
  echo "Created ${BACKEND_ENV_SOURCE}. Fill it with backend secrets, then rerun bootstrap." >&2
  exit 1
fi

cp "$BACKEND_ENV_SOURCE" "$APP_DIR/apps/backend/.env.production"
chmod 600 "$APP_DIR/apps/backend/.env.production"

cat > /etc/dolphin/ecosystem.config.cjs <<EOF
module.exports = {
  apps: [
    {
      name: 'dolphin-api',
      cwd: '${APP_DIR}/apps/backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: '${API_PORT}'
      }
    }
  ]
}
EOF

cat > /opt/pgadmin/servers.json <<'EOF'
{
  "Servers": {
    "1": {
      "Name": "Dolphin Railway Postgres",
      "Group": "Servers",
      "Host": "switchback.proxy.rlwy.net",
      "Port": 56485,
      "MaintenanceDB": "railway",
      "Username": "postgres",
      "SSLMode": "require"
    }
  }
}
EOF

docker rm -f dolphin-pgadmin >/dev/null 2>&1 || true
docker run -d \
  --name dolphin-pgadmin \
  --restart unless-stopped \
  -p 127.0.0.1:5050:80 \
  -e PGADMIN_DEFAULT_EMAIL="$PGADMIN_EMAIL" \
  -e PGADMIN_DEFAULT_PASSWORD="$PGADMIN_PASSWORD" \
  -e PGADMIN_CONFIG_ENHANCED_COOKIE_PROTECTION=False \
  -e PGADMIN_CONFIG_PROXY_X_HOST_COUNT=1 \
  -e PGADMIN_CONFIG_PROXY_X_PREFIX_COUNT=1 \
  -e PGADMIN_CONFIG_SCRIPT_NAME="'/pgadmin'" \
  -v /opt/pgadmin/servers.json:/pgadmin4/servers.json:ro \
  dpage/pgadmin4:latest

cat > /etc/nginx/sites-available/dolphin <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50m;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        application/json
        application/javascript
        application/xml
        application/xml+rss
        image/svg+xml
        font/ttf
        font/otf
        font/woff
        font/woff2;

    location /api/ {
        proxy_pass http://127.0.0.1:5002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5002/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
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

    location ^~ /admin/static/ {
        alias /var/www/dolphin/apps/admin/build/static/;
        access_log off;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = /admin {
        return 301 /admin/;
    }

    location = /admin/ {
        root /var/www/dolphin/apps/admin/build;
        add_header Clear-Site-Data "\"cache\"";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files /index.html =404;
    }

    location ^~ /admin/ {
        alias /var/www/dolphin/apps/admin/build/;
        add_header Clear-Site-Data "\"cache\"";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri /admin/index.html;
    }

    location ^~ /auth/ {
        alias /var/www/dolphin/apps/admin/build/;
        add_header Clear-Site-Data "\"cache\"";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri /admin/index.html;
    }

    root /var/www/dolphin/apps/client/dist;
    index index.html;

    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = / {
        if ($host = admin.shopnship.in) {
            return 302 /admin/dashboard;
        }
        add_header Clear-Site-Data "\"cache\"";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri $uri/ /index.html;
    }

    location / {
        add_header Clear-Site-Data "\"cache\"";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri $uri/ /index.html;
    }
}
EOF
sed -i "s/admin.shopnship.in/${ADMIN_DOMAIN}/g" /etc/nginx/sites-available/dolphin
sed -i "s/server_name _;/server_name ${DOMAIN_NAMES};/" /etc/nginx/sites-available/dolphin

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/dolphin /etc/nginx/sites-enabled/dolphin

ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

systemctl enable nginx
systemctl restart nginx

if [ "$ENABLE_SSL" = "true" ]; then
  SERVER_IP="${SERVER_IP:-$(curl -4fsS --max-time 5 https://api.ipify.org || true)}"
  CERTBOT_DOMAINS=()

  for domain in $DOMAIN_NAMES; do
    DOMAIN_IP="$(getent ahostsv4 "$domain" | awk '{print $1; exit}' || true)"
    if [ -n "$DOMAIN_IP" ] && { [ -z "$SERVER_IP" ] || [ "$DOMAIN_IP" = "$SERVER_IP" ]; }; then
      CERTBOT_DOMAINS+=("-d" "$domain")
    else
      echo "Skipping SSL for ${domain}: DNS resolves to ${DOMAIN_IP:-nothing}; expected ${SERVER_IP:-this VPS IP}."
    fi
  done

  if [ "${#CERTBOT_DOMAINS[@]}" -gt 0 ]; then
    apt-get install -y certbot python3-certbot-nginx
    if ! certbot --nginx --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect "${CERTBOT_DOMAINS[@]}"; then
      echo "Certbot did not complete. Fix DNS, then rerun this script or run certbot manually." >&2
    fi
  else
    echo "No domain currently resolves to this VPS, so SSL was not requested."
  fi
fi

PUBLIC_ORIGIN="$PUBLIC_ORIGIN" CLIENT_ORIGIN="$CLIENT_ORIGIN" ADMIN_ORIGIN="$ADMIN_ORIGIN" API_ORIGIN="$API_ORIGIN" bash "$APP_DIR/scripts/vps/deploy.sh"
pm2 startup systemd -u root --hp /root || true

echo "Bootstrap complete."
echo "Frontend: ${CLIENT_ORIGIN}"
echo "Admin: ${ADMIN_ORIGIN}"
echo "API health: ${PUBLIC_ORIGIN}/api/health"
echo "pgAdmin: ${PUBLIC_ORIGIN}/pgadmin/"
