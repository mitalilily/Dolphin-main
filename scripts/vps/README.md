# Dolphin VPS Deployment

This deploys the current monorepo to a single VPS with path routing:

- Landing/client frontend: `http://72.60.96.97/`
- Client app entry: `http://72.60.96.97/app`
- Admin frontend: `http://72.60.96.97/admin/`
- API: `http://72.60.96.97/api/`
- pgAdmin: `http://72.60.96.97/pgadmin/`

## One-time VPS bootstrap

Create `/root/dolphin-backend.env` on the VPS with the backend production env values first. Keep this file outside git.

Then run:

```bash
PUBLIC_ORIGIN=http://72.60.96.97 \
PGADMIN_EMAIL=admin@dolphin-enterprise.com \
PGADMIN_PASSWORD='<strong-password>' \
bash /var/www/dolphin/scripts/vps/bootstrap.sh
```

If the repo is not cloned yet, clone it first:

```bash
git clone https://github.com/mitalilily/Dolphin-main.git /var/www/dolphin
```

## GitHub Actions secrets

Add these repository secrets before relying on automatic deploys:

```text
VPS_HOST=72.60.96.97
VPS_USER=root
VPS_SSH_KEY=<private key allowed in /root/.ssh/authorized_keys>
VPS_PASSWORD=<optional fallback if no SSH key is configured>
PUBLIC_ORIGIN=http://72.60.96.97
```

The workflow runs on every push to `main` and executes `scripts/vps/deploy.sh` on the VPS.

For the one-time `Bootstrap VPS` workflow, also add:

```text
BACKEND_ENV=<full backend .env.production content>
PGADMIN_EMAIL=<pgAdmin login email>
PGADMIN_PASSWORD=<pgAdmin login password>
```
