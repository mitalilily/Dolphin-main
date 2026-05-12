#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/dolphin}"
REPO_URL="${REPO_URL:-https://github.com/mitalilily/Dolphin-main.git}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-shopnship.in}"
MARKETING_DOMAINS="${MARKETING_DOMAINS:-$PRIMARY_DOMAIN www.$PRIMARY_DOMAIN}"
CLIENT_DOMAIN="${CLIENT_DOMAIN:-client.$PRIMARY_DOMAIN}"
CLIENT_EXTRA_DOMAINS="${CLIENT_EXTRA_DOMAINS:-app.$PRIMARY_DOMAIN}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.$PRIMARY_DOMAIN}"
API_DOMAIN="${API_DOMAIN:-api.$PRIMARY_DOMAIN}"
CLIENT_SERVER_NAMES="${CLIENT_SERVER_NAMES:-$CLIENT_DOMAIN $CLIENT_EXTRA_DOMAINS}"
DOMAIN_NAMES="${DOMAIN_NAMES:-$MARKETING_DOMAINS $CLIENT_SERVER_NAMES $ADMIN_DOMAIN $API_DOMAIN}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://$PRIMARY_DOMAIN}"
CLIENT_ORIGIN="${CLIENT_ORIGIN:-https://$CLIENT_DOMAIN}"
ADMIN_ORIGIN="${ADMIN_ORIGIN:-https://$ADMIN_DOMAIN}"
API_ORIGIN="${API_ORIGIN:-https://$API_DOMAIN}"
API_PORT="${API_PORT:-5002}"

purge_stale_frontend_assets() {
  local target_dir="$1"
  [ -d "$target_dir" ] || return 0

  while IFS= read -r -d '' asset; do
    if grep -Iq . "$asset" && grep -Eq \
      'dolphinenterprises\.in/api|dolphin-backend-production|Start backend or set VITE_API_URL|Existing token storage|backend exposes|Save Delhivery Credentials|Save Ekart Credentials|Save Xpressbees Credentials|Ekart Logistics' \
      "$asset"; then
      rm -f "$asset"
    fi
  done < <(find "$target_dir" -type f -print0)
}

mkdir -p "$APP_DIR"
cd "$APP_DIR"
git config --global --add safe.directory "$APP_DIR" >/dev/null 2>&1 || true

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Git checkout missing or invalid in $APP_DIR; restoring checkout."
  rm -rf .git
  git init
  git remote add origin "$REPO_URL"
fi

if [ -d .git ]; then
  echo "Syncing repository with origin/main..."
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REPO_URL"
  else
    git remote add origin "$REPO_URL"
  fi
  git fetch --prune origin "+refs/heads/main:refs/remotes/origin/main"
  git reset --hard origin/main
  git show -s --oneline --decorate HEAD
fi

cat > apps/client/.env.marketing.local <<EOF
VITE_APP_SURFACE=marketing
VITE_MARKETING_SITE_URL=${PUBLIC_ORIGIN}
VITE_API_URL=${API_ORIGIN}/api
VITE_APP_SOCKET_URL=${API_ORIGIN}
VITE_CLIENT_APP_URL=${CLIENT_ORIGIN}
VITE_AUTH_APP_URL=${CLIENT_ORIGIN}/login
VITE_ADMIN_APP_URL=${ADMIN_ORIGIN}
VITE_ADMIN_AUTH_URL=${ADMIN_ORIGIN}/auth/signin
EOF

cat > apps/client/.env.app.local <<EOF
VITE_APP_SURFACE=app
VITE_MARKETING_SITE_URL=${PUBLIC_ORIGIN}
VITE_API_URL=${API_ORIGIN}/api
VITE_APP_SOCKET_URL=${API_ORIGIN}
VITE_CLIENT_APP_URL=${CLIENT_ORIGIN}
VITE_AUTH_APP_URL=${CLIENT_ORIGIN}/login
VITE_ADMIN_APP_URL=${ADMIN_ORIGIN}
VITE_ADMIN_AUTH_URL=${ADMIN_ORIGIN}/auth/signin
EOF

cat > apps/admin/.env.production <<EOF
REACT_APP_API_BASE_URL=${API_ORIGIN}/api
REACT_APP_SOCKET_URL=${API_ORIGIN}
REACT_APP_LANDING_URL=${PUBLIC_ORIGIN}
REACT_APP_CLIENT_APP_URL=${CLIENT_ORIGIN}
EOF

echo "Installing backend dependencies..."
npm --prefix apps/backend ci
echo "Building backend..."
npm --prefix apps/backend run build

echo "Installing client dependencies..."
npm --prefix apps/client ci
if [ -d .git ]; then
  git restore --source=HEAD -- apps/client/yarn.lock 2>/dev/null || true
fi
echo "Building marketing frontend for ${PUBLIC_ORIGIN}..."
npm --prefix apps/client run build:marketing
rm -rf apps/client/dist-marketing
cp -a apps/client/dist apps/client/dist-marketing
purge_stale_frontend_assets apps/client/dist-marketing/assets

echo "Building seller dashboard frontend for ${CLIENT_ORIGIN}..."
npm --prefix apps/client run build:app
rm -rf apps/client/dist-app
cp -a apps/client/dist apps/client/dist-app
purge_stale_frontend_assets apps/client/dist-app/assets

echo "Installing admin dependencies..."
if [ -f apps/admin/package-lock.json ]; then
  npm --prefix apps/admin ci --legacy-peer-deps
else
  npm --prefix apps/admin install --legacy-peer-deps
fi
echo "Building admin frontend for ${ADMIN_ORIGIN}..."
ADMIN_STATIC_BACKUP="$(mktemp -d)"
if [ -d apps/admin/build/static ]; then
  mkdir -p "$ADMIN_STATIC_BACKUP/static"
  cp -a apps/admin/build/static/. "$ADMIN_STATIC_BACKUP/static/"
fi
(
  cd apps/admin
  CI=false DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false PUBLIC_URL=/ npx react-scripts build
)
if [ -d "$ADMIN_STATIC_BACKUP/static" ]; then
  mkdir -p apps/admin/build/static
  cp -an "$ADMIN_STATIC_BACKUP/static/." apps/admin/build/static/ || true
  find apps/admin/build/static -type f -mtime +21 -delete || true
fi
rm -rf "$ADMIN_STATIC_BACKUP"
purge_stale_frontend_assets apps/admin/build/static

echo "Restarting API..."
pm2 startOrReload /etc/dolphin/ecosystem.config.cjs --only dolphin-api --update-env
pm2 save

echo "Reloading Nginx..."
APP_DIR="$APP_DIR" PRIMARY_DOMAIN="$PRIMARY_DOMAIN" MARKETING_DOMAINS="$MARKETING_DOMAINS" CLIENT_DOMAIN="$CLIENT_DOMAIN" CLIENT_EXTRA_DOMAINS="$CLIENT_EXTRA_DOMAINS" CLIENT_SERVER_NAMES="$CLIENT_SERVER_NAMES" ADMIN_DOMAIN="$ADMIN_DOMAIN" API_DOMAIN="$API_DOMAIN" API_ORIGIN="$API_ORIGIN" API_PORT="$API_PORT" bash "$APP_DIR/scripts/vps/write-nginx-config.sh"
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/dolphin /etc/nginx/sites-enabled/dolphin
nginx -t
systemctl reload nginx

echo "Deployment finished."
