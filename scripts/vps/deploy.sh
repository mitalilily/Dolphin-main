#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/dolphin}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-shopnship.in}"
DOMAIN_NAMES="${DOMAIN_NAMES:-$PRIMARY_DOMAIN www.$PRIMARY_DOMAIN app.$PRIMARY_DOMAIN admin.$PRIMARY_DOMAIN api.$PRIMARY_DOMAIN}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://$PRIMARY_DOMAIN}"
API_ORIGIN="${API_ORIGIN:-$PUBLIC_ORIGIN}"
API_PORT="${API_PORT:-5002}"
BACKEND_ENV_SOURCE="${BACKEND_ENV_SOURCE:-/root/dolphin-backend.env}"
SKIP_DEPLOY_GIT_SYNC="${SKIP_DEPLOY_GIT_SYNC:-false}"
DEPLOY_COMMIT="${DEPLOY_COMMIT:-}"
USE_LOCAL_POSTGRES="${USE_LOCAL_POSTGRES:-false}"
LOCAL_POSTGRES_CONTAINER="${LOCAL_POSTGRES_CONTAINER:-dolphin-postgres}"
LOCAL_POSTGRES_IMAGE="${LOCAL_POSTGRES_IMAGE:-postgres:16-alpine}"
LOCAL_POSTGRES_DB="${LOCAL_POSTGRES_DB:-dolphin}"
LOCAL_POSTGRES_USER="${LOCAL_POSTGRES_USER:-dolphin}"
LOCAL_POSTGRES_PASSWORD="${LOCAL_POSTGRES_PASSWORD:-DolphinLocalPostgres_2026_Strong}"
LOCAL_POSTGRES_DATA="${LOCAL_POSTGRES_DATA:-/opt/dolphin-postgres/data}"
BACKUP_DATABASE_BEFORE_PATCHES="${BACKUP_DATABASE_BEFORE_PATCHES:-true}"
DB_BACKUP_DIR="${DB_BACKUP_DIR:-/var/backups/dolphin}"
SKIP_BACKEND_BUILD="${SKIP_BACKEND_BUILD:-false}"
SKIP_CLIENT_BUILD="${SKIP_CLIENT_BUILD:-false}"
SKIP_ADMIN_BUILD="${SKIP_ADMIN_BUILD:-false}"

build_cors_origins() {
  local origins="${PUBLIC_ORIGIN},${PUBLIC_ORIGIN}/admin"
  for domain in $DOMAIN_NAMES; do
    origins="${origins},https://${domain},http://${domain}"
  done
  printf '%s' "$origins"
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped_value

  touch "$file"
  escaped_value="${value//&/\\&}"
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${escaped_value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

ensure_local_postgres() {
  if [ "$USE_LOCAL_POSTGRES" != "true" ]; then
    return
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required when USE_LOCAL_POSTGRES=true." >&2
    exit 1
  fi

  mkdir -p "$LOCAL_POSTGRES_DATA"

  if docker inspect "$LOCAL_POSTGRES_CONTAINER" >/dev/null 2>&1; then
    docker start "$LOCAL_POSTGRES_CONTAINER" >/dev/null
  else
    docker run -d \
      --name "$LOCAL_POSTGRES_CONTAINER" \
      --restart unless-stopped \
      -p 127.0.0.1:5432:5432 \
      -e POSTGRES_DB="$LOCAL_POSTGRES_DB" \
      -e POSTGRES_USER="$LOCAL_POSTGRES_USER" \
      -e POSTGRES_PASSWORD="$LOCAL_POSTGRES_PASSWORD" \
      -v "$LOCAL_POSTGRES_DATA:/var/lib/postgresql/data" \
      "$LOCAL_POSTGRES_IMAGE" >/dev/null
  fi

  for attempt in $(seq 1 30); do
    if docker exec "$LOCAL_POSTGRES_CONTAINER" pg_isready -U "$LOCAL_POSTGRES_USER" -d "$LOCAL_POSTGRES_DB" >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done

  echo "Postgres did not become ready in time." >&2
  exit 1
}

ensure_backend_env() {
  local cors_origins
  cors_origins="$(build_cors_origins)"

  touch "$BACKEND_ENV_SOURCE"
  chmod 600 "$BACKEND_ENV_SOURCE"

  set_env_value "$BACKEND_ENV_SOURCE" NODE_ENV production
  set_env_value "$BACKEND_ENV_SOURCE" PORT "$API_PORT"
  set_env_value "$BACKEND_ENV_SOURCE" CORS_ALLOWED_ORIGINS "$cors_origins"
  set_env_value "$BACKEND_ENV_SOURCE" CORS_ORIGINS "$cors_origins"
  set_env_value "$BACKEND_ENV_SOURCE" FRONTEND_URL "$PUBLIC_ORIGIN"
  set_env_value "$BACKEND_ENV_SOURCE" API_URL "$API_ORIGIN"

  if [ "$USE_LOCAL_POSTGRES" = "true" ]; then
    set_env_value "$BACKEND_ENV_SOURCE" DATABASE_URL "postgresql://${LOCAL_POSTGRES_USER}:${LOCAL_POSTGRES_PASSWORD}@127.0.0.1:5432/${LOCAL_POSTGRES_DB}"
    set_env_value "$BACKEND_ENV_SOURCE" PGSSLMODE disable
  fi
}

require_database_url() {
  if ! grep -Eq '^DATABASE_URL=.{8,}' "$BACKEND_ENV_SOURCE"; then
    echo "DATABASE_URL is missing in ${BACKEND_ENV_SOURCE}." >&2
    echo "Refusing to deploy against an empty database config. Restore BACKEND_ENV or set USE_LOCAL_POSTGRES=true intentionally." >&2
    exit 1
  fi

  if [ "$USE_LOCAL_POSTGRES" != "true" ] && grep -Eq '^DATABASE_URL=.*(127\.0\.0\.1|localhost|dolphin-postgres)' "$BACKEND_ENV_SOURCE"; then
    echo "DATABASE_URL in ${BACKEND_ENV_SOURCE} points to a local database while USE_LOCAL_POSTGRES is not enabled." >&2
    echo "Refusing to deploy because this can hide the real production courier/rate-card data." >&2
    exit 1
  fi
}

backup_database() {
  if [ "$BACKUP_DATABASE_BEFORE_PATCHES" != "true" ]; then
    return
  fi

  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "pg_dump is not installed; skipping database backup." >&2
    return
  fi

  local database_url
  local backup_file
  database_url="$(grep -E '^DATABASE_URL=' "$BACKEND_ENV_SOURCE" | tail -n 1 | cut -d= -f2-)"
  backup_file="${DB_BACKUP_DIR}/dolphin-$(date -u +%Y%m%dT%H%M%SZ).sql"

  mkdir -p "$DB_BACKUP_DIR"
  chmod 700 "$DB_BACKUP_DIR"

  echo "Backing up database before schema patches..."
  pg_dump --no-owner --no-acl "$database_url" > "$backup_file"
  chmod 600 "$backup_file"
  echo "Database backup written to ${backup_file}."
}

write_nginx_config() {
  local nginx_site="$1"
  local cert_path="/etc/letsencrypt/live/${PRIMARY_DOMAIN}/fullchain.pem"
  local key_path="/etc/letsencrypt/live/${PRIMARY_DOMAIN}/privkey.pem"

  if [ -f "$cert_path" ] && [ -f "$key_path" ]; then
    cat > "$nginx_site" <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _ ${DOMAIN_NAMES};
    return 301 https://${PRIMARY_DOMAIN}\$request_uri;
}

server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name _ ${DOMAIN_NAMES};

    ssl_certificate ${cert_path};
    ssl_certificate_key ${key_path};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

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
        proxy_pass http://127.0.0.1:${API_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:${API_PORT}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /pgadmin/ {
        proxy_pass http://127.0.0.1:5050/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Script-Name /pgadmin;
        proxy_set_header X-Scheme \$scheme;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_redirect off;
    }

    location ^~ /admin/static/ {
        alias ${APP_DIR}/apps/admin/build/static/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location = /admin {
        return 301 /admin/;
    }

    location = /admin/ {
        root ${APP_DIR}/apps/admin/build;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files /index.html =404;
    }

    location ^~ /admin/ {
        alias ${APP_DIR}/apps/admin/build/;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri /admin/index.html;
    }

    location ^~ /auth/ {
        alias ${APP_DIR}/apps/admin/build/;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri /admin/index.html;
    }

    root ${APP_DIR}/apps/client/dist;
    index index.html;

    location /assets/ {
        try_files \$uri =404;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
  else
    cat > "$nginx_site" <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _ ${DOMAIN_NAMES};

    client_max_body_size 50m;

    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:${API_PORT}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /pgadmin/ {
        proxy_pass http://127.0.0.1:5050/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Script-Name /pgadmin;
        proxy_set_header X-Scheme \$scheme;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_redirect off;
    }

    location ^~ /admin/static/ {
        alias ${APP_DIR}/apps/admin/build/static/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location = /admin {
        return 301 /admin/;
    }

    location = /admin/ {
        root ${APP_DIR}/apps/admin/build;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files /index.html =404;
    }

    location ^~ /admin/ {
        alias ${APP_DIR}/apps/admin/build/;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri /admin/index.html;
    }

    location ^~ /auth/ {
        alias ${APP_DIR}/apps/admin/build/;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri /admin/index.html;
    }

    root ${APP_DIR}/apps/client/dist;
    index index.html;

    location /assets/ {
        try_files \$uri =404;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
  fi
}

cd "$APP_DIR"

if [ -n "$DEPLOY_COMMIT" ]; then
  echo "Deploying commit ${DEPLOY_COMMIT}..."
fi

if [ -d .git ] && [ "$SKIP_DEPLOY_GIT_SYNC" != "true" ]; then
  echo "Syncing repository with origin/main..."
  git fetch --prune origin "+refs/heads/main:refs/remotes/origin/main"
  git reset --hard origin/main
  git show -s --oneline --decorate HEAD
elif [ "$SKIP_DEPLOY_GIT_SYNC" = "true" ]; then
  echo "Using source already synced by GitHub Actions."
  git show -s --oneline --decorate HEAD 2>/dev/null || true
fi

ensure_local_postgres
ensure_backend_env
require_database_url

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
if [ "$SKIP_BACKEND_BUILD" = "true" ] && [ -f apps/backend/dist/index.js ]; then
  echo "Using backend build synced by GitHub Actions."
else
  echo "Building backend..."
  npm --prefix apps/backend run build
fi
echo "Applying database schema and seed data..."
backup_database
(
  cd apps/backend
  NODE_ENV=production npx drizzle-kit push --force

  NODE_ENV=production npx ts-node src/scripts/patchInvoicePreferencesColumns.ts
  NODE_ENV=production npx ts-node src/scripts/patchInvoiceSequencesTable.ts
  NODE_ENV=production npx ts-node src/scripts/patchKycColumns.ts
  NODE_ENV=production npx ts-node src/scripts/patchCustomerRoles.ts
  NODE_ENV=production npx ts-node src/scripts/patchOrderLabelColumns.ts
  NODE_ENV=production npx ts-node src/scripts/patchCourierCredentialsApiKeyType.ts

  NODE_ENV=production npx ts-node src/scripts/seedBasicPlan.ts
  NODE_ENV=production npx ts-node src/scripts/assignBasicPlans.ts
  NODE_ENV=production npx ts-node src/scripts/ensureDolphinAdmin.ts
  NODE_ENV=production npx ts-node src/scripts/seedHolidays.ts

  if [ "${RUN_INVOICE_DATA_BACKFILLS:-false}" = "true" ]; then
    NODE_ENV=production npx ts-node src/scripts/migrateInvoices.ts
    NODE_ENV=production npx ts-node src/scripts/backfillInvoiceWalletPayments.ts
  fi
)

echo "Installing client dependencies..."
if [ "$SKIP_CLIENT_BUILD" = "true" ] && [ -f apps/client/dist/index.html ]; then
  echo "Using client build synced by GitHub Actions."
else
  npm --prefix apps/client ci
  if [ -d .git ] && [ "$SKIP_DEPLOY_GIT_SYNC" != "true" ]; then
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
fi

echo "Installing admin dependencies..."
if [ "$SKIP_ADMIN_BUILD" = "true" ] && [ -f apps/admin/build/index.html ]; then
  echo "Using admin build synced by GitHub Actions."
else
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
fi

echo "Restarting API..."
pm2 startOrReload /etc/dolphin/ecosystem.config.cjs --only dolphin-api --update-env
pm2 save

echo "Reloading Nginx..."
NGINX_SITE="/etc/nginx/sites-available/dolphin"
mkdir -p "$(dirname "$NGINX_SITE")"
write_nginx_config "$NGINX_SITE"
nginx -t
systemctl reload nginx

echo "Deployment finished."
