#!/usr/bin/env bash
# SMTP GoTrue no Supabase self-hosted (emails do Studio / fallback Auth).
# Uso no VPS (não commitar SMTP_PASS):
#   SMTP_PASS='senha-noreply' bash configure-smtp-env.sh
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/supabase-aamihe/docker/.env}"

SMTP_HOST="${SMTP_HOST:-mail.aamihe.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-noreply@aamihe.com}"
SMTP_ADMIN_EMAIL="${SMTP_ADMIN_EMAIL:-noreply@aamihe.com}"
SMTP_SENDER_NAME="${SMTP_SENDER_NAME:-AAMIHE}"

if [[ -z "${SMTP_PASS:-}" ]]; then
  echo "Defina SMTP_PASS (palavra-passe da conta noreply@aamihe.com no DirectAdmin)."
  exit 1
fi

set_var() {
  local k="$1" v="$2"
  if grep -q "^${k}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$ENV_FILE"
  else
    echo "${k}=${v}" >> "$ENV_FILE"
  fi
}

set_var GOTRUE_SMTP_HOST "$SMTP_HOST"
set_var GOTRUE_SMTP_PORT "$SMTP_PORT"
set_var GOTRUE_SMTP_USER "$SMTP_USER"
set_var GOTRUE_SMTP_PASS "$SMTP_PASS"
set_var GOTRUE_SMTP_ADMIN_EMAIL "$SMTP_ADMIN_EMAIL"
set_var GOTRUE_SMTP_SENDER_NAME "$SMTP_SENDER_NAME"

cd /opt/supabase-aamihe/docker
docker compose restart auth

echo "SMTP Auth reiniciado (${SMTP_USER}@${SMTP_HOST}:${SMTP_PORT})."
