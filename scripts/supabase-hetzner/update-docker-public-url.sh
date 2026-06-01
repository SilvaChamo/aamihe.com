#!/usr/bin/env bash
# Actualiza URLs públicas do Supabase Docker (após mudar subdomínio).
# Uso: bash update-docker-public-url.sh https://supabase.aamihe.com
set -euo pipefail

URL="${1:-https://supabase.aamihe.com}"
COMPOSE_DIR="/opt/supabase-aamihe/docker"
ENV_FILE="${COMPOSE_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Não encontrado: $ENV_FILE"
  exit 1
fi

for var in SITE_URL API_EXTERNAL_URL SUPABASE_PUBLIC_URL; do
  if grep -q "^${var}=" "$ENV_FILE"; then
    sed -i "s|^${var}=.*|${var}=${URL}|" "$ENV_FILE"
  else
    echo "${var}=${URL}" >> "$ENV_FILE"
  fi
done

cd "$COMPOSE_DIR"
docker compose up -d

echo "URLs Docker actualizadas para ${URL}"
grep -E '^(SITE_URL|API_EXTERNAL_URL|SUPABASE_PUBLIC_URL)=' "$ENV_FILE"
