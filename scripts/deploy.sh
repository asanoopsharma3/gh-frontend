#!/usr/bin/env bash
set -euo pipefail

# Deploy Vite build output to the live web root.
# Default web root: parent of frontend folder (common htdocs layout).
FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="${DEPLOY_WEB_ROOT:-$(dirname "$FRONTEND_DIR")}"

echo "Frontend: $FRONTEND_DIR"
echo "Web root: $WEB_ROOT"

cd "$FRONTEND_DIR"

echo ">> Pulling latest code..."
git pull --ff-only

echo ">> Installing dependencies..."
npm ci || npm install

echo ">> Building..."
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "ERROR: dist/index.html not found. Build failed?"
  exit 1
fi

echo ">> Build hash:"
grep -oE 'index-[^" ]+\.(js|css)' dist/index.html | sort -u

echo ">> Copying dist/* to web root..."
mkdir -p "$WEB_ROOT/assets"
cp -r dist/* "$WEB_ROOT/"

if [[ -f .htaccess ]]; then
  cp .htaccess "$WEB_ROOT/.htaccess"
fi

echo ">> Live hash (web root index.html):"
grep -oE 'index-[^" ]+\.(js|css)' "$WEB_ROOT/index.html" | sort -u

echo ">> Deploy complete."
