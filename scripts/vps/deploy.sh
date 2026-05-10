#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/dolphin}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-shopnship.in}"
DOMAIN_NAMES="${DOMAIN_NAMES:-$PRIMARY_DOMAIN www.$PRIMARY_DOMAIN app.$PRIMARY_DOMAIN admin.$PRIMARY_DOMAIN api.$PRIMARY_DOMAIN}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://$PRIMARY_DOMAIN}"
API_ORIGIN="${API_ORIGIN:-$PUBLIC_ORIGIN}"
API_PORT="${API_PORT:-5002}"
BACKEND_ENV_SOURCE="${BACKEND_ENV_SOURCE:-/root/dolphin-backend.env}"

cd "$APP_DIR"

if [ -d .git ]; then
  echo "Syncing repository with origin/main..."
  git fetch --prune origin "+refs/heads/main:refs/remotes/origin/main"
  git reset --hard origin/main
  git show -s --oneline --decorate HEAD
fi

cat > apps/client/.env.production <<EOF
VITE_API_URL=${API_ORIGIN}/api
VITE_APP_SOCKET_URL=${API_ORIGIN}
VITE_CLIENT_APP_URL=${PUBLIC_ORIGIN}/app
VITE_AUTH_APP_URL=${PUBLIC_ORIGIN}/login
VITE_ADMIN_APP_URL=${PUBLIC_ORIGIN}/admin
VITE_ADMIN_AUTH_URL=${PUBLIC_ORIGIN}/auth/signin
EOF

cat > apps/admin/.env.production <<EOF
REACT_APP_API_BASE_URL=${API_ORIGIN}/api
REACT_APP_SOCKET_URL=${API_ORIGIN}
EOF

if [ -f "$BACKEND_ENV_SOURCE" ]; then
  cp "$BACKEND_ENV_SOURCE" apps/backend/.env.production
  cp "$BACKEND_ENV_SOURCE" apps/backend/.env
  chmod 600 apps/backend/.env.production apps/backend/.env
fi

echo "Installing backend dependencies..."
npm --prefix apps/backend ci
echo "Building backend..."
npm --prefix apps/backend run build

echo "Installing client dependencies..."
npm --prefix apps/client ci
if [ -d .git ]; then
  git restore --source=HEAD -- apps/client/yarn.lock 2>/dev/null || true
fi
echo "Building client and landing frontend..."
CLIENT_ASSET_BACKUP="$(mktemp -d)"
if [ -d apps/client/dist/assets ]; then
  mkdir -p "$CLIENT_ASSET_BACKUP/assets"
  cp -a apps/client/dist/assets/. "$CLIENT_ASSET_BACKUP/assets/"
fi
npm --prefix apps/client run build:netlify
if [ -d "$CLIENT_ASSET_BACKUP/assets" ]; then
  mkdir -p apps/client/dist/assets
  cp -an "$CLIENT_ASSET_BACKUP/assets/." apps/client/dist/assets/ || true
  grep -rl '72.60.96.97' apps/client/dist/assets 2>/dev/null | xargs -r rm -f
  find apps/client/dist/assets -type f -mtime +21 -delete || true
fi
rm -rf "$CLIENT_ASSET_BACKUP"

echo "Installing admin dependencies..."
if [ -f apps/admin/package-lock.json ]; then
  npm --prefix apps/admin ci --legacy-peer-deps
else
  npm --prefix apps/admin install --legacy-peer-deps
fi
echo "Building admin frontend under /admin..."
ADMIN_STATIC_BACKUP="$(mktemp -d)"
if [ -d apps/admin/build/static ]; then
  mkdir -p "$ADMIN_STATIC_BACKUP/static"
  cp -a apps/admin/build/static/. "$ADMIN_STATIC_BACKUP/static/"
fi
(
  cd apps/admin
  CI=false DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false PUBLIC_URL=/admin npx react-scripts build
)
if [ -d "$ADMIN_STATIC_BACKUP/static" ]; then
  mkdir -p apps/admin/build/static
  cp -an "$ADMIN_STATIC_BACKUP/static/." apps/admin/build/static/ || true
  grep -rl '72.60.96.97' apps/admin/build/static 2>/dev/null | xargs -r rm -f
  find apps/admin/build/static -type f -mtime +21 -delete || true
fi
rm -rf "$ADMIN_STATIC_BACKUP"

echo "Restarting API..."
pm2 startOrReload /etc/dolphin/ecosystem.config.cjs --only dolphin-api --update-env
pm2 save

echo "Reloading Nginx..."
NGINX_SITE="/etc/nginx/sites-available/dolphin"
if [ -f "$NGINX_SITE" ]; then
  if grep -q 'server_name ' "$NGINX_SITE"; then
    sed -i "s/server_name .*/server_name ${DOMAIN_NAMES};/g" "$NGINX_SITE"
  fi
  if ! grep -q 'location = /admin {' "$NGINX_SITE"; then
    sed -i '/location \^~ \/admin\/static\/ {/i\
    location = /admin {\
        return 301 /admin/;\
    }\
\
    location = /admin/ {\
        root /var/www/dolphin/apps/admin/build;\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\
        try_files /index.html =404;\
    }\
' "$NGINX_SITE"
  fi
  sed -i 's#try_files \$uri \$uri/ /admin/index.html;#try_files $uri /admin/index.html;#g' "$NGINX_SITE"
  if ! grep -q 'gzip on;' "$NGINX_SITE"; then
    sed -i '/client_max_body_size 50m;/a\
    sendfile on;\
    tcp_nopush on;\
    tcp_nodelay on;\
    keepalive_timeout 65;\
\
    gzip on;\
    gzip_vary on;\
    gzip_proxied any;\
    gzip_comp_level 6;\
    gzip_min_length 1024;\
    gzip_types\
        text/plain\
        text/css\
        text/xml\
        application/json\
        application/javascript\
        application/xml\
        application/xml+rss\
        image/svg+xml\
        font/ttf\
        font/otf\
        font/woff\
        font/woff2;' "$NGINX_SITE"
  fi
  if ! grep -q 'max-age=2592000, immutable' "$NGINX_SITE"; then
    sed -i '/expires 30d;/a\        add_header Cache-Control "public, max-age=2592000, immutable";' "$NGINX_SITE"
  fi
  if ! grep -q 'no-cache, no-store, must-revalidate' "$NGINX_SITE"; then
    sed -i '/location \^~ \/admin\/ {/a\        add_header Cache-Control "no-cache, no-store, must-revalidate";' "$NGINX_SITE"
    sed -i '/location \^~ \/auth\/ {/a\        add_header Cache-Control "no-cache, no-store, must-revalidate";' "$NGINX_SITE"
    sed -i '/location \/ {/a\        add_header Cache-Control "no-cache, no-store, must-revalidate";' "$NGINX_SITE"
  fi
fi
nginx -t
systemctl reload nginx

echo "Deployment finished."
