#!/usr/bin/env bash
# Activa Google OAuth no GoTrue (Hetzner) e URLs públicas AAMIHE.
# Uso no servidor (com credenciais no ambiente):
#   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... bash configure-google-oauth.sh
set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase-aamihe/docker}"
ENV_FILE="${ENV_FILE:-${COMPOSE_DIR}/.env}"
OVERRIDE="${COMPOSE_DIR}/docker-compose.override.yml"
PUBLIC_URL="${PUBLIC_URL:-https://supabase.aamihe.com}"
SITE_URL="${SITE_URL:-https://aamihe.com}"

CLIENT_ID="${GOOGLE_CLIENT_ID:?Defina GOOGLE_CLIENT_ID}"
CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:?Defina GOOGLE_CLIENT_SECRET}"

set_var() {
  local k="$1" v="$2"
  if grep -q "^${k}=" "$ENV_FILE"; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$ENV_FILE"
  else
    echo "${k}=${v}" >> "$ENV_FILE"
  fi
}

set_var SITE_URL "$SITE_URL"
set_var API_EXTERNAL_URL "$PUBLIC_URL"
set_var SUPABASE_PUBLIC_URL "$PUBLIC_URL"
set_var GOOGLE_ENABLED "true"
set_var GOOGLE_CLIENT_ID "$CLIENT_ID"
set_var GOOGLE_SECRET "$CLIENT_SECRET"

REDIRECTS="https://aamihe.com/auth/callback,https://aamihe.com/auth/confirm,https://aamihe.vercel.app/auth/callback,https://aamihe.vercel.app/auth/confirm,http://localhost:3004/auth/callback,http://localhost:3004/auth/confirm"
set_var ADDITIONAL_REDIRECT_URLS "$REDIRECTS"

cat > "$OVERRIDE" <<EOF
# Gerado por configure-google-oauth.sh — Auth AAMIHE
services:
  auth:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      GOTRUE_MAILER_EXTERNAL_HOSTS: supabase.aamihe.com,aamihe.com
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: "${CLIENT_ID}"
      GOTRUE_EXTERNAL_GOOGLE_SECRET: "${CLIENT_SECRET}"
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: "${PUBLIC_URL}/auth/v1/callback"
EOF

cd "$COMPOSE_DIR"
docker compose up -d auth kong studio

echo "Google OAuth activo. SITE_URL=${SITE_URL} API=${PUBLIC_URL}"
