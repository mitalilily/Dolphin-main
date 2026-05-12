# Dolphin VPS Deployment

This deploys the monorepo with production-style host separation:

- Marketing site: `https://shopnship.in/`
- Seller dashboard: `https://app.shopnship.in/`
- Admin panel: `https://admin.shopnship.in/`
- Backend API and sockets: `https://api.shopnship.in/`
- pgAdmin: `https://api.shopnship.in/pgadmin/`

## DNS Records

Point these Hostinger DNS records to the VPS IP `72.60.96.97`:

```text
Type  Name   Value
A     @      72.60.96.97
A     www    72.60.96.97
A     client 72.60.96.97
A     app    72.60.96.97
A     admin  72.60.96.97
A     api    72.60.96.97
```

Remove old records that point the client/app/API domains somewhere else. SSL is requested only for names that already resolve to the VPS.

## One-Time VPS Bootstrap

Create `/root/dolphin-backend.env` on the VPS with the backend production env values first. Keep this file outside git.

Then run:

```bash
PUBLIC_ORIGIN=https://shopnship.in \
CLIENT_ORIGIN=https://app.shopnship.in \
CLIENT_DOMAIN=app.shopnship.in \
CLIENT_EXTRA_DOMAINS= \
ADMIN_ORIGIN=https://admin.shopnship.in \
API_ORIGIN=https://api.shopnship.in \
PGADMIN_EMAIL=admin@shopnship.in \
PGADMIN_PASSWORD='<strong-password>' \
bash /var/www/dolphin/scripts/vps/bootstrap.sh
```

If the repo is not cloned yet, clone it first:

```bash
git clone https://github.com/mitalilily/Dolphin-main.git /var/www/dolphin
```

## GitHub Actions Secrets

Add these repository secrets before relying on automatic deploys. `VPS_HOST`, `VPS_USER`, and the public origins default to the values below, but keeping them as secrets makes future VPS moves easier.

```text
VPS_HOST=72.60.96.97
VPS_USER=root
VPS_SSH_KEY=<private key allowed in /root/.ssh/authorized_keys>
VPS_PASSWORD=<optional fallback if no SSH key is configured>
PUBLIC_ORIGIN=https://shopnship.in
CLIENT_ORIGIN=https://app.shopnship.in
CLIENT_DOMAIN=app.shopnship.in
CLIENT_EXTRA_DOMAINS=
ADMIN_ORIGIN=https://admin.shopnship.in
API_ORIGIN=https://api.shopnship.in
```

The workflow runs on every push to `main`, resets `/var/www/dolphin` to `origin/main`, and executes `scripts/vps/deploy.sh` on the VPS. Set either `VPS_SSH_KEY` or `VPS_PASSWORD`; the deploy job fails early if both are missing.

For the one-time `Bootstrap VPS` workflow, also add:

```text
BACKEND_ENV=<full backend .env.production content>
PGADMIN_EMAIL=<pgAdmin login email>
PGADMIN_PASSWORD=<pgAdmin login password>
```

## Backend Logs

After logging in as root:

```bash
cd /var/www/dolphin
pm2 status
pm2 logs dolphin-api --lines 200
```

For Nginx/domain issues:

```bash
nginx -t
tail -n 100 /var/log/nginx/error.log
tail -n 100 /var/log/nginx/access.log
```
