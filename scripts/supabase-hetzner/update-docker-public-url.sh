#!/usr/bin/env bash
# Actualiza URLs públicas do Supabase Docker (após mudar subdomínio).
# Uso: bash update-docker-public-url.sh https://supabase.visualdesignmoz.com
set -euo pipefail

PUBLIC_URL="${1:-https://supabase.visualdesignmoz.com}"
SITE_URL="${SITE_URL:-https://aamihe.com}"
COMPOSE_DIR="/opt/supabase-aamihe/docker"
ENV_FILE="${COMPOSE_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Não encontrado: $ENV_FILE"
  exit 1
fi

for var in API_EXTERNAL_URL SUPABASE_PUBLIC_URL; do
  if grep -q "^${var}=" "$ENV_FILE"; then
    sed -i "s|^${var}=.*|${var}=${PUBLIC_URL}|" "$ENV_FILE"
  else
    echo "${var}=${PUBLIC_URL}" >> "$ENV_FILE"
  fi
done

if grep -q "^SITE_URL=" "$ENV_FILE"; then
  sed -i "s|^SITE_URL=.*|SITE_URL=${SITE_URL}|" "$ENV_FILE"
else
  echo "SITE_URL=${SITE_URL}" >> "$ENV_FILE"
fi

cd "$COMPOSE_DIR"
docker compose up -d

echo "URLs Docker actualizadas. API=${PUBLIC_URL} SITE=${SITE_URL}"
grep -E '^(SITE_URL|API_EXTERNAL_URL|SUPABASE_PUBLIC_URL)=' "$ENV_FILE"
