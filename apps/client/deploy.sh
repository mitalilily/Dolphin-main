#!/bin/bash

# Build and deploy script for dolphin client
# Usage: ./deploy.sh [vps_user@vps_ip]
# Example: ./deploy.sh user@your-server-ip
# Note: You will be prompted for your VPS password during upload
# Or set environment variables: VPS_USER=user VPS_IP=ip ./deploy.sh

# Don't exit on error for SSH/rsync operations (they may prompt for password)
set +e

# VPS configuration
VPS_TARGET_PATH="/var/www/dolphin/client/dist"

# Get VPS connection details from argument or environment variables
if [ -n "$1" ]; then
  VPS_CONNECTION="$1"
elif [ -n "$VPS_USER" ] && [ -n "$VPS_IP" ]; then
  VPS_CONNECTION="${VPS_USER}@${VPS_IP}"
else
  echo "âŒ Error: Please provide VPS connection details"
  echo ""
  echo "Usage:"
  echo "  $0 user@vps_ip"
  echo "  or"
  echo "  VPS_USER=user VPS_IP=ip $0"
  echo ""
  exit 1
fi

echo "ðŸš€ Building dolphin client..."

# Navigate to project directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "ðŸ“¦ Installing dependencies..."
  npm install
fi

# Run the build (this should exit on error)
set -e
echo "ðŸ”¨ Running build with production environment variables..."

# Set production environment variables
# Vite uses VITE_ prefix for environment variables
# Require explicit values to avoid deploying with stale/dead hardcoded domains.
if [ -z "${VITE_API_URL}" ]; then
  echo "Error: VITE_API_URL is required. Example: https://<your-backend-domain>/api"
  exit 1
fi

if [ -z "${VITE_APP_SOCKET_URL}" ]; then
  echo "Error: VITE_APP_SOCKET_URL is required. Example: https://<your-backend-domain>"
  exit 1
fi

# Keep other environment variables from .env if needed (Shopify, Google OAuth, etc.)
# These can be overridden here if you have different production values
# For now, we'll let them use values from .env if they exist, or set defaults
export VITE_GOOGLE_OAUTH_CLIENT_ID="${VITE_GOOGLE_OAUTH_CLIENT_ID:-826545993291-8cv3997ckrkj9ns33bfb1jpm917dfkl4.apps.googleusercontent.com}"

echo "ðŸ“¡ Using production API URL: ${VITE_API_URL}"
echo "ðŸ“¡ Using production Socket URL: ${VITE_APP_SOCKET_URL}"
echo ""

yarn build
set +e

# Check if build was successful
if [ ! -d "dist" ]; then
  echo "âŒ Build failed! 'dist' folder not found."
  exit 1
fi

echo "âœ… Build successful! Output size:"
du -sh dist

# Upload to VPS
echo ""
echo "ðŸ“¤ Uploading to VPS: ${VPS_CONNECTION}:${VPS_TARGET_PATH}"
echo "ðŸ” You will be prompted for your VPS password"
echo ""

# Create dist directory on VPS if it doesn't exist
echo "ðŸ“ Creating dist directory on VPS if it doesn't exist..."
ssh "${VPS_CONNECTION}" "mkdir -p ${VPS_TARGET_PATH}"
SSH_EXIT_CODE=$?

if [ $SSH_EXIT_CODE -ne 0 ]; then
  echo "âŒ Failed to connect to VPS. Please check your credentials."
  exit 1
fi

echo "âœ… Dist directory ready: ${VPS_TARGET_PATH}"

# Use rsync to upload dist folder contents
# NO --delete flag = nothing will be deleted on VPS, all existing files are kept
# Only files from local dist/ folder will be uploaded/updated
echo "ðŸ“¤ Uploading dist files..."
echo "   (This will add/update dist files and keep ALL existing files on VPS)"
rsync -avz --progress dist/ "${VPS_CONNECTION}:${VPS_TARGET_PATH}/"
RSYNC_EXIT_CODE=$?

if [ $RSYNC_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "âœ… Deployment complete!"
  echo "ðŸ“ Dist files uploaded to: ${VPS_TARGET_PATH}"
  echo "ðŸ“‚ Structure: client/dist/ (contains index.html, assets/, etc.)"
  echo "ðŸ’¡ All existing files in client/ are kept untouched"
else
  echo ""
  echo "âŒ Upload failed. Please check your connection and try again."
  exit 1
fi
echo ""

