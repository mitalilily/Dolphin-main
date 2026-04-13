# Skyrush Main

This repository brings the Skyrush codebase together in one monorepo without changing the original source repositories. The currently deployed links stay safe as long as those existing repos remain connected in Netlify, Vercel, and Render until you finish switching them over.

## Repository Layout

- `apps/admin` - imported from `https://github.com/mitalilily/skyrush-admin`
- `apps/client` - imported from `https://github.com/mitalilily/skyrush-client`
- `apps/landing` - imported from `https://github.com/mitalilily/skyrush-landing` and flattened from its original `delexpress-main/` folder
- `apps/backend` - imported from `https://github.com/mitalilily/skyrush-backend`

## Run Locally

- Admin: `cd apps/admin && npm install --legacy-peer-deps && npm start`
- Client: `cd apps/client && npm install && npm run dev`
- Landing: `cd apps/landing && npm install && npm run dev`
- Backend: `cd apps/backend && npm install && npm run dev`

## Reconnect Deployments To This Repo

Keep the same environment variables and secrets. Only update the connected repository and app directory after you have verified the first deployment.

- Netlify admin: select `apps/admin` in monorepo setup. Build command `npm run build:netlify`, publish directory `build`, Node `20`, `NPM_FLAGS=--legacy-peer-deps`.
- Netlify client: select `apps/client` in monorepo setup. Build command `npm run build:netlify`, publish directory `dist`, Node `20`.
- Netlify landing: select `apps/landing` in monorepo setup. Build command `npm run build`, publish directory `dist`.
- Vercel client: set the Root Directory to `apps/client`.
- Render backend: set the Root Directory to `apps/backend`, or deploy with the root `render.yaml` in this repository.

Do not delete the old repositories until each hosted app has been reconnected to this repo, redeployed, and checked in production.
