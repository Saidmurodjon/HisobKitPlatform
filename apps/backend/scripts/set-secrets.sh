#!/usr/bin/env bash
# Push all required Cloudflare Workers secrets from the local .env file.
# Usage: bash scripts/set-secrets.sh

set -e

if [ ! -f .env ]; then
  echo "❌  .env file not found in apps/backend/"
  exit 1
fi

echo "🔐  Pushing secrets to Cloudflare Workers (hisobkit-api)..."

secrets=(
  DATABASE_URL
  DIRECT_URL
  JWT_SECRET
  GOOGLE_CLIENT_ID
  TELEGRAM_BOT_TOKEN
)

for secret in "${secrets[@]}"; do
  value=$(grep "^${secret}=" .env | cut -d '=' -f2- | tr -d '"')
  if [ -z "$value" ]; then
    echo "  ⚠️   Skipping $secret (not set in .env)"
    continue
  fi
  echo -n "  📤  Uploading $secret ... "
  echo "$value" | wrangler secret put "$secret" --name hisobkit-api
  echo "done"
done

echo ""
echo "✅  All secrets pushed. Run 'wrangler deploy' to deploy."
