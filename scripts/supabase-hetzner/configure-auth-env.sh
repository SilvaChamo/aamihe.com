#!/usr/bin/env bash
# Redirect URLs e site URL no Auth (GoTrue) — servidor AAMIHE.
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/supabase-aamihe/docker/.env}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase-aamihe/docker}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_URL="${SITE_URL:-https://aamihe.com}"

REDIRECTS="https://aamihe.com/auth/callback,https://aamihe.com/auth/confirm,https://aamihe.vercel.app/auth/callback,https://aamihe.vercel.app/auth/confirm,http://localhost:3004/auth/callback,http://localhost:3004/auth/confirm"

set_var() {
  local k="$1" v="$2"
  if grep -q "^${k}=" "$ENV_FILE"; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$ENV_FILE"
  else
    echo "${k}=${v}" >> "$ENV_FILE"
  fi
}

set_var SITE_URL "$SITE_URL"
set_var API_EXTERNAL_URL "https://supabase.visualdesignmoz.com"
set_var SUPABASE_PUBLIC_URL "https://supabase.visualdesignmoz.com"
set_var ADDITIONAL_REDIRECT_URLS "$REDIRECTS"

cp -f "${SCRIPT_DIR}/docker-compose.auth-email.override.yml" "${COMPOSE_DIR}/docker-compose.override.yml"

cd "$COMPOSE_DIR"
docker compose up -d auth kong studio

echo "Auth URLs configuradas. SITE_URL=${SITE_URL}"
echo "Override com GOTRUE_MAILER_EXTERNAL_HOSTS aplicado."
