#!/bin/bash

# Script to remove build files from admin-dashboard root directory
# These files should only be in the build/ subdirectory
# Usage: ./cleanup-build-files.sh [vps_user@vps_ip]
# Example: ./cleanup-build-files.sh user@your-server-ip

set +e

VPS_TARGET_PATH="/var/www/delexpress/admin-dashboard"

if [ -n "$1" ]; then
  VPS_CONNECTION="$1"
elif [ -n "$VPS_USER" ] && [ -n "$VPS_IP" ]; then
  VPS_CONNECTION="${VPS_USER}@${VPS_IP}"
else
  echo "âŒ Error: Please provide VPS connection details"
  exit 1
fi

echo "ðŸ§¹ Cleaning up build files from admin-dashboard root directory"
echo "ðŸ” You will be prompted for your VPS password"
echo ""
echo "âš ï¸  This will remove build files from root (they belong in build/ subdirectory):"
echo "   - asset-manifest.json"
echo "   - favicon.ico"
echo "   - index.html"
echo "   - logo/"
echo "   - manifest.json"
echo "   - static/"
echo "   - login-bg.jpg"
echo "   - admin.ico"
echo "   - apple-icon.png"
echo ""
echo "âœ… Source files will remain untouched (src/, node_modules/, package.json, etc.)"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "âŒ Cancelled"
  exit 1
fi

echo ""
echo "ðŸ“ Removing build files from root directory..."

# Remove build files from root (keep source files)
ssh "${VPS_CONNECTION}" "cd ${VPS_TARGET_PATH} && \
  rm -f asset-manifest.json favicon.ico index.html manifest.json login-bg.jpg admin.ico apple-icon.png && \
  rm -rf logo/ static/ 2>/dev/null || true"

if [ $? -eq 0 ]; then
  echo "âœ… Cleanup complete! Build files removed from root directory."
  echo "ðŸ’¡ These files should now be in build/ subdirectory after deployment"
else
  echo "âš ï¸  Some files couldn't be removed (may not exist or permission issue)"
fi

echo ""
echo "ðŸ“‹ Remaining files on VPS root:"
ssh "${VPS_CONNECTION}" "ls -la ${VPS_TARGET_PATH}"

