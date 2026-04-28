# Real Deployment Checklist

Use this checklist with your CURRENT active domains from Railway project settings.
Do not use stale/old preview domains.

## 1) Backend env vars (Railway/Render)
Set these on backend hosting:

```env
NODE_ENV=production
PORT=5002
DATABASE_URL=<your postgres connection string>
PGSSLMODE=require

ACCESS_TOKEN_SECRET=<strong-random>
REFRESH_TOKEN_SECRET=<strong-random>
JWT_SECRET=<strong-random>
COURIER_SECRET_KEY=<strong-random>

API_URL=https://<your-active-backend-domain>
FRONTEND_URL=https://<your-active-client-domain>

# IMPORTANT: include your real admin URL too when available
CORS_ALLOWED_ORIGINS=https://<your-active-client-domain>,https://<your-active-admin-domain>
CORS_ORIGINS=https://<your-active-client-domain>,https://<your-active-admin-domain>

# Shiprocket
SHIPROCKET_API_BASE=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_EMAIL=<shiprocket-email>
SHIPROCKET_PASSWORD=<shiprocket-password>
SHIPROCKET_AUTH_TOKEN=<optional-preseeded-token>
SHIPROCKET_DEFAULT_PICKUP_LOCATION=<optional>
SHIPROCKET_DEFAULT_CHANNEL_ID=<optional>

# Shipmozo
SHIPMOZO_API_BASE=https://shipping-api.com/app/api/v1
SHIPMOZO_PUBLIC_KEY=<shipmozo-public-key>
SHIPMOZO_PRIVATE_KEY=<shipmozo-private-key>
SHIPMOZO_USERNAME=<shipmozo-username>
SHIPMOZO_PASSWORD=<shipmozo-password>
SHIPMOZO_DEFAULT_WAREHOUSE_ID=<optional>

# iCarry
ICARRY_API_BASE=https://www.icarry.in
ICARRY_USERNAME=<icarry-username>
ICARRY_API_KEY=<icarry-api-key>
ICARRY_PASSWORD=<optional>
ICARRY_CLIENT_ID=<optional>
ICARRY_WEBHOOK_TOKEN=<recommended-secret-token>
```

## 2) Client env vars
Set these on client hosting:

```env
VITE_API_URL=https://<your-active-backend-domain>/api
VITE_APP_SOCKET_URL=https://<your-active-backend-domain>
VITE_GOOGLE_OAUTH_CLIENT_ID=<if used>
```

## 3) Admin env vars
Set these on admin hosting:

```env
REACT_APP_API_BASE_URL=https://<your-active-backend-domain>/api
REACT_APP_SOCKET_URL=https://<your-active-backend-domain>
```

## 4) Database migration
From `apps/backend`:

```bash
npm run migrate
```

No new DB migration is required specifically for the latest iCarry feature additions.

## 5) Webhook setup in iCarry dashboard
Set callback URL to:

`https://<your-active-backend-domain>/api/v1/webhook/icarry/callback`

Token to configure in iCarry panel should match:
- `ICARRY_WEBHOOK_TOKEN` (preferred), or
- `ICARRY_API_KEY` fallback.

## 6) Redeploy order
1. Redeploy backend
2. Redeploy client
3. Redeploy admin

## 7) Post-deploy smoke tests
Use admin API tools / Postman / internal test scripts.

### Serviceability
- `POST /api/admin/couriers/icarry/pincode-serviceability`

### International flow
- `POST /api/admin/couriers/icarry/estimate/international`
- `POST /api/admin/couriers/icarry/shipment/international`

### Shipment operations
- `POST /api/admin/couriers/icarry/shipment/track`
- `POST /api/admin/couriers/icarry/shipment/label`
- `POST /api/admin/couriers/icarry/shipment/cancel`
- `POST /api/admin/couriers/icarry/shipment/reverse`
- `POST /api/admin/couriers/icarry/shipment/sync-status`
- `POST /api/admin/couriers/icarry/shipment/sync-charges`

### Pickup address operations
- `POST /api/admin/couriers/icarry/pickup-address/add`
- `POST /api/admin/couriers/icarry/pickup-address/edit`

## 8) UI verification checklist
After deploy, verify:
1. Admin `Courier Credentials` page shows an iCarry card and can save credentials.
2. Admin `Couriers` page provider filter includes `iCarry`.
3. iCarry appears under service provider management when provider records exist.
4. Client login opens and auth requests hit backend domain (not frontend domain).

## 9) Known external blocker
iCarry live API may return:
`Direct API access restricted due to excessive requests / plan does not support it.`

If seen, integration is still correct; account access needs to be enabled by iCarry.
