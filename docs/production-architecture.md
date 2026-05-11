# Production Domain Architecture

The production topology is split by responsibility:

| Host | Service | Build/deploy target |
| --- | --- | --- |
| `shopnship.in` | Marketing and public landing pages | `apps/client`, `npm run build:marketing` |
| `app.shopnship.in` | Seller/client dashboard | `apps/client`, `npm run build:app` |
| `admin.shopnship.in` | Admin panel | `apps/admin`, `npm run build:netlify` or VPS admin build |
| `api.shopnship.in` | Backend REST APIs and Socket.IO | `apps/backend`, `npm run build && npm start` |

## Frontend Environment

Marketing and seller app are two separate builds of `apps/client`:

```text
VITE_APP_SURFACE=marketing
VITE_MARKETING_SITE_URL=https://shopnship.in
VITE_CLIENT_APP_URL=https://app.shopnship.in
VITE_AUTH_APP_URL=https://app.shopnship.in/login
VITE_ADMIN_APP_URL=https://admin.shopnship.in
VITE_ADMIN_AUTH_URL=https://admin.shopnship.in/auth/signin
VITE_API_URL=https://api.shopnship.in/api
VITE_APP_SOCKET_URL=https://api.shopnship.in
```

Use `VITE_APP_SURFACE=app` for the seller dashboard deployment. The committed Netlify/Vercel configs include the same defaults.

## Backend Environment

The backend should allow browser requests from only the public frontend hosts:

```text
CORS_ALLOWED_ORIGINS=https://shopnship.in,https://www.shopnship.in,https://app.shopnship.in,https://admin.shopnship.in
CORS_ORIGINS=https://shopnship.in,https://www.shopnship.in,https://app.shopnship.in,https://admin.shopnship.in
FRONTEND_URL=https://shopnship.in
CLIENT_APP_URL=https://app.shopnship.in
ADMIN_APP_URL=https://admin.shopnship.in
API_URL=https://api.shopnship.in
```

For the VPS path, `scripts/vps/deploy.sh` builds `dist-marketing`, `dist-app`, the admin build, and rewrites Nginx virtual hosts for the four domains.
