#!/usr/bin/env bash
# Norte — one-shot provisioning for an Ubuntu 24.04 EC2 box (escopo §2 deploy).
#
# Run from the repo root ON THE INSTANCE:
#     bash scripts/provision.sh
#
# Idempotent: safe to re-run after a `git pull` to rebuild and restart. See
# docs/deploy.md for the full runbook (AWS + Tailscale).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE=norte

echo "==> Norte provisioning in $REPO_DIR"

# 1. Swap (2 GB) so the 1 GB free-tier box can run `next build` without OOM.
if ! sudo swapon --show | grep -q '/swapfile'; then
  echo "==> Creating 2 GB swap"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

# 2. System packages + Node 22 LTS (NodeSource). build-essential/python3 are the
#    fallback toolchain for better-sqlite3's native build.
sudo apt-get update -y
sudo apt-get install -y build-essential python3 git curl
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  echo "==> Installing Node 22 LTS"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 3. The env file must exist before migrations (DATABASE_URL lives there).
if [ ! -f "$REPO_DIR/.env" ]; then
  echo "!! Missing .env — copy .env.example to .env and fill it in first:" >&2
  echo "     cp .env.example .env && nano .env" >&2
  exit 1
fi

# 4. Install deps (postinstall runs `prisma generate`), apply migrations, build.
cd "$REPO_DIR"
npm ci
npx prisma migrate deploy
npm run build

# 5. Install / refresh the systemd service and (re)start it.
sudo cp "$REPO_DIR/deploy/$SERVICE.service" "/etc/systemd/system/$SERVICE.service"
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE"
sudo systemctl restart "$SERVICE"

echo "==> Done. Service status:"
sudo systemctl --no-pager status "$SERVICE" | head -n 8
echo
echo "==> App is on http://localhost:3000 — expose it on your tailnet with:"
echo "      sudo tailscale serve --bg 3000"
