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
echo "==> Syncing ${BRANCH} with origin/${BRANCH}"
git fetch origin
git reset --hard "origin/${BRANCH}"

echo "==> Installing dependencies"
npm install

echo "==> Building production bundle"
npm run build

PUBLISH_DIR="${DEPLOY_PUBLIC_DIR:-}"
if [ -z "$PUBLISH_DIR" ] && [ "$(basename "$ROOT_DIR")" = "frontend" ]; then
  PUBLISH_DIR="$(cd "$ROOT_DIR/.." && pwd)"
fi

if [ -n "${PUBLISH_DIR}" ] && [ -d "$ROOT_DIR/dist" ]; then
  echo "==> Publishing dist to ${PUBLISH_DIR}"
  cp -R "$ROOT_DIR/dist/." "$PUBLISH_DIR/"
fi

echo "==> Deploy complete"
echo "    Build: ${ROOT_DIR}/dist"
if [ -n "${PUBLISH_DIR:-}" ]; then
  echo "    Live:  ${PUBLISH_DIR}"
fi
