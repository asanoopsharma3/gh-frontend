#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Deploying frontend from $(pwd)"

if [ ! -d .git ]; then
  echo "Error: this folder is not a git repository."
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "==> Pulling latest code from origin/${BRANCH}"
git fetch origin
git pull --ff-only origin "$BRANCH"

if [ -f package-lock.json ]; then
  echo "==> Installing dependencies (npm ci)"
  npm ci
else
  echo "==> Installing dependencies (npm install)"
  npm install
fi

echo "==> Building production bundle"
npm run build

echo "==> Deploy complete. Output: ${ROOT_DIR}/dist"
