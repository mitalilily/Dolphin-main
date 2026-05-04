#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/dolphin}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-http://72.60.96.97}"
API_ORIGIN="${API_ORIGIN:-$PUBLIC_ORIGIN}"
API_PORT="${API_PORT:-5002}"

cd "$APP_DIR"

if [ -d .git ]; then
  git fetch origin main
  git reset --hard origin/main
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

echo "Installing backend dependencies..."
npm --prefix apps/backend ci
echo "Building backend..."
npm --prefix apps/backend run build

echo "Installing client dependencies..."
npm --prefix apps/client ci
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
  find apps/admin/build/static -type f -mtime +21 -delete || true
fi
rm -rf "$ADMIN_STATIC_BACKUP"

echo "Restarting API..."
pm2 startOrReload /etc/dolphin/ecosystem.config.cjs --only dolphin-api --update-env
pm2 save

echo "Reloading Nginx..."
NGINX_SITE="/etc/nginx/sites-available/dolphin"
if [ -f "$NGINX_SITE" ]; then
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
