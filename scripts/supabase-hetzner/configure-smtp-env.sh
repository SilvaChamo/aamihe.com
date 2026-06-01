#!/usr/bin/env bash
# SMTP do Auth (GoTrue) — variáveis SMTP_* no .env (não GOTRUE_SMTP_*).
#
# Modo local (recomendado): Exim no host, porta 25.
#   bash configure-smtp-env.sh
#
# Modo remoto (mail.aamihe.com:587 — só se a porta estiver aberta):
#   SMTP_MODE=remote SMTP_PASS='...' bash configure-smtp-env.sh
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/supabase-aamihe/docker/.env}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase-aamihe/docker}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

if [[ "$SMTP_MODE" == "local" ]]; then
  HOST="${SMTP_HOST:-host.docker.internal}"
  PORT="${SMTP_PORT:-25}"
  set_var SMTP_HOST "$HOST"
  set_var SMTP_PORT "$PORT"
  set_var SMTP_ADMIN_EMAIL "$SMTP_ADMIN_EMAIL"
  set_var SMTP_SENDER_NAME "$SMTP_SENDER_NAME"
  set_var SMTP_USER ""
  set_var SMTP_PASS ""
  echo "Modo local: Auth → ${HOST}:${PORT} (Exim/DirectAdmin no host)."
else
  HOST="${SMTP_HOST:-mail.aamihe.com}"
  PORT="${SMTP_PORT:-587}"
  USER="${SMTP_USER:-noreply@aamihe.com}"
  if [[ -z "${SMTP_PASS:-}" ]]; then
    echo "Modo remote: defina SMTP_PASS."
    exit 1
  fi
  set_var SMTP_HOST "$HOST"
  set_var SMTP_PORT "$PORT"
  set_var SMTP_USER "$USER"
  set_var SMTP_PASS "$SMTP_PASS"
  set_var SMTP_ADMIN_EMAIL "$SMTP_ADMIN_EMAIL"
  set_var SMTP_SENDER_NAME "$SMTP_SENDER_NAME"
  echo "Modo remote: Auth → ${USER}@${HOST}:${PORT}."
fi

cp -f "${SCRIPT_DIR}/docker-compose.auth-email.override.yml" "${COMPOSE_DIR}/docker-compose.override.yml"

cd "$COMPOSE_DIR"
docker compose up -d auth

echo ""
echo "Verifique no contentor:"
echo "  docker compose exec auth printenv | grep -E 'GOTRUE_SMTP|MAILER_EXTERNAL'"
echo "  (SMTP_HOST no .env deve ser ${HOST:-host.docker.internal}, não mail.aamihe.com)"
