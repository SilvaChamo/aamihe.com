#!/usr/bin/env bash
# SMTP GoTrue (Auth) no Supabase self-hosted — envio a partir do VPS.
#
# Modo local (recomendado): Exim/DirectAdmin no host, porta 25, sem auth.
#   bash configure-smtp-env.sh
#
# Modo remoto (mail.aamihe.com:587 com autenticação):
#   SMTP_MODE=remote SMTP_PASS='...' bash configure-smtp-env.sh
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/supabase-aamihe/docker/.env}"
SMTP_MODE="${SMTP_MODE:-local}"

SMTP_ADMIN_EMAIL="${SMTP_ADMIN_EMAIL:-noreply@aamihe.com}"
SMTP_SENDER_NAME="${SMTP_SENDER_NAME:-AAMIHE}"

set_var() {
  local k="$1" v="$2"
  if grep -q "^${k}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$ENV_FILE"
  else
    echo "${k}=${v}" >> "$ENV_FILE"
  fi
}

unset_var() {
  local k="$1"
  if grep -q "^${k}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "/^${k}=/d" "$ENV_FILE"
  fi
}

if [[ "$SMTP_MODE" == "local" ]]; then
  set_var GOTRUE_SMTP_HOST "${SMTP_HOST:-host.docker.internal}"
  set_var GOTRUE_SMTP_PORT "${SMTP_PORT:-25}"
  set_var GOTRUE_SMTP_ADMIN_EMAIL "$SMTP_ADMIN_EMAIL"
  set_var GOTRUE_SMTP_SENDER_NAME "$SMTP_SENDER_NAME"
  unset_var GOTRUE_SMTP_USER
  unset_var GOTRUE_SMTP_PASS
  echo "Modo local: GoTrue → ${SMTP_HOST:-host.docker.internal}:${SMTP_PORT:-25} (Exim no host)."
else
  SMTP_HOST="${SMTP_HOST:-mail.aamihe.com}"
  SMTP_PORT="${SMTP_PORT:-587}"
  SMTP_USER="${SMTP_USER:-noreply@aamihe.com}"
  if [[ -z "${SMTP_PASS:-}" ]]; then
    echo "Modo remote: defina SMTP_PASS (conta noreply@aamihe.com)."
    exit 1
  fi
  set_var GOTRUE_SMTP_HOST "$SMTP_HOST"
  set_var GOTRUE_SMTP_PORT "$SMTP_PORT"
  set_var GOTRUE_SMTP_USER "$SMTP_USER"
  set_var GOTRUE_SMTP_PASS "$SMTP_PASS"
  set_var GOTRUE_SMTP_ADMIN_EMAIL "$SMTP_ADMIN_EMAIL"
  set_var GOTRUE_SMTP_SENDER_NAME "$SMTP_SENDER_NAME"
  echo "Modo remote: GoTrue → ${SMTP_USER}@${SMTP_HOST}:${SMTP_PORT}."
fi

cd /opt/supabase-aamihe/docker
docker compose restart auth

echo "Auth reiniciado. Teste «Repor senha» no site (aguarde ~60s entre tentativas)."
