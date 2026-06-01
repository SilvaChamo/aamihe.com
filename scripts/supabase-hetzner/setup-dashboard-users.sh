#!/usr/bin/env bash
# Duas contas Studio (Kong basic-auth): Admin (você) + Supabase (cliente).
# Executar no servidor: bash /root/setup-dashboard-users.sh
set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase-aamihe/docker}"
KONG_YML="${COMPOSE_DIR}/volumes/api/kong.yml"
ENV_FILE="${COMPOSE_DIR}/.env"

ADMIN_USER="${ADMIN_USER:-Admin}"
ADMIN_PASS="${ADMIN_PASS:-Administrador#01?*}"
CLIENT_USER="${CLIENT_USER:-Supabase}"
CLIENT_PASS="${CLIENT_PASS:-=Bdgest.AaSupabase?*}"

if [[ ! -f "$KONG_YML" ]] || [[ ! -f "$ENV_FILE" ]]; then
  echo "Não encontrado: $KONG_YML ou $ENV_FILE"
  exit 1
fi

# .env — passwords entre aspas (caracteres especiais)
set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=\"${val}\"|" "$ENV_FILE"
  else
    echo "${key}=\"${val}\"" >> "$ENV_FILE"
  fi
}

set_env DASHBOARD_USERNAME "$ADMIN_USER"
set_env DASHBOARD_PASSWORD "$ADMIN_PASS"
set_env DASHBOARD_USERNAME_CLIENT "$CLIENT_USER"
set_env DASHBOARD_PASSWORD_CLIENT "$CLIENT_PASS"

# Segunda credencial no Kong
if ! grep -q "DASHBOARD_USERNAME_CLIENT" "$KONG_YML"; then
  cp -a "$KONG_YML" "${KONG_YML}.bak.$(date +%Y%m%d%H%M%S)"
  sed -i "/password: '\$DASHBOARD_PASSWORD'/a\\
  - consumer: DASHBOARD\\
    username: '\$DASHBOARD_USERNAME_CLIENT'\\
    password: '\$DASHBOARD_PASSWORD_CLIENT'" "$KONG_YML"
  echo "Kong: segunda conta adicionada em kong.yml"
else
  echo "Kong: segunda conta já configurada"
fi

cd "$COMPOSE_DIR"
docker compose up -d

echo ""
echo "Contas Studio (https://supabase.aamihe.com):"
echo "  Admin (você):     ${ADMIN_USER}"
echo "  Supabase (cliente): ${CLIENT_USER}"
echo ""
echo "Reinicie o browser ou use janela privada se o login antigo ficar em cache."
