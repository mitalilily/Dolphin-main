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
npm --prefix apps/client run build:netlify

echo "Installing admin dependencies..."
if [ -f apps/admin/package-lock.json ]; then
  npm --prefix apps/admin ci --legacy-peer-deps
else
  npm --prefix apps/admin install --legacy-peer-deps
fi
echo "Building admin frontend under /admin..."
(
  cd apps/admin
  CI=false DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false PUBLIC_URL=/admin npx react-scripts build
)

echo "Restarting API..."
pm2 startOrReload /etc/dolphin/ecosystem.config.cjs --only dolphin-api --update-env
pm2 save

echo "Reloading Nginx..."
nginx -t
systemctl reload nginx

echo "Deployment finished."
