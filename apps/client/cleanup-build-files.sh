#!/bin/bash

# Script to remove build files from dolphin-client root directory
# These files should only be in the dist/ subdirectory
# Usage: ./cleanup-build-files.sh [vps_user@vps_ip]
# Example: ./cleanup-build-files.sh user@your-server-ip

set +e

VPS_TARGET_PATH="/var/www/dolphin/dolphin-client"

if [ -n "$1" ]; then
  VPS_CONNECTION="$1"
elif [ -n "$VPS_USER" ] && [ -n "$VPS_IP" ]; then
  VPS_CONNECTION="${VPS_USER}@${VPS_IP}"
else
  echo "Ã¢ÂÅ’ Error: Please provide VPS connection details"
  exit 1
fi

echo "Ã°Å¸Â§Â¹ Cleaning up build files from dolphin-client root directory"
echo "Ã°Å¸â€Â You will be prompted for your VPS password"
echo ""
echo "Ã¢Å¡Â Ã¯Â¸Â  This will remove the dist/ folder from root (it should be recreated as dist/ subdirectory by deploy script):"
echo "   - dist/ folder"
echo ""
echo "Ã¢Å“â€¦ Source files will remain untouched (src/, node_modules/, package.json, etc.)"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Ã¢ÂÅ’ Cancelled"
  exit 1
fi

echo ""
echo "Ã°Å¸â€œÂ Removing dist folder from root directory..."

# Remove dist folder from root (it will be recreated as dist/ subdirectory by deploy script)
ssh "${VPS_CONNECTION}" "cd ${VPS_TARGET_PATH} && rm -rf dist/ 2>/dev/null || true"

if [ $? -eq 0 ]; then
  echo "Ã¢Å“â€¦ Cleanup complete! Dist folder removed from root directory."
  echo "Ã°Å¸â€™Â¡ The dist/ subdirectory will be created by the deploy script"
else
  echo "Ã¢Å¡Â Ã¯Â¸Â  Dist folder couldn't be removed (may not exist or permission issue)"
fi

echo ""
echo "Ã°Å¸â€œâ€¹ Remaining files on VPS root:"
ssh "${VPS_CONNECTION}" "ls -la ${VPS_TARGET_PATH}"
