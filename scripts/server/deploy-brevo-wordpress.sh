#!/usr/bin/env bash
# Envia mu-plugin Brevo + config + symlinks para WordPress no VPS.
#
# Uso (Mac, pasta scripts/server):
#   ./deploy-brevo-wordpress.sh
#   WP_DEPLOY_FILTER=oshercollective.com ./deploy-brevo-wordpress.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=connection.env
source "$SCRIPT_DIR/connection.env"

ENV_FILE="${PROJECT_ROOT}/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta ${ENV_FILE} com SMTP_PASS."
  exit 1
fi

read_env() {
  local key="$1"
  local line val
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -1 || true)"
  val="${line#*=}"
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  printf '%s' "$val"
}

SMTP_PASS="$(read_env SMTP_PASS)"
SMTP_HOST="$(read_env SMTP_HOST)"
SMTP_PORT="$(read_env SMTP_PORT)"
SMTP_SECURE="$(read_env SMTP_SECURE)"
SMTP_USER="$(read_env SMTP_USER)"

if [[ -z "$SMTP_PASS" ]]; then
  echo "Defina SMTP_PASS em .env.local"
  exit 1
fi

SSH_OPTS=(-p "$SERVER_SSH_PORT" -o ConnectTimeout=15 -o ServerAliveInterval=30)
if [[ -n "${SSH_IDENTITY:-}" && -f "${SSH_IDENTITY}" ]]; then
  SSH_OPTS+=(-i "$SSH_IDENTITY" -o BatchMode=yes)
  RSYNC_SSH="ssh -p ${SERVER_SSH_PORT} -i ${SSH_IDENTITY} -o ConnectTimeout=15 -o ServerAliveInterval=30"
else
  RSYNC_SSH="ssh -p ${SERVER_SSH_PORT} -o ConnectTimeout=15 -o ServerAliveInterval=30"
fi

HOST="${SMTP_HOST:-smtp-relay.brevo.com}"
PORT="${SMTP_PORT:-587}"
USER="${SMTP_USER:-ad3ca6001@smtp-brevo.com}"
SECURE="${SMTP_SECURE:-tls}"
if [[ "$SECURE" == "false" || "$SECURE" == "0" ]]; then
  SECURE="tls"
fi

echo "==> Scripts + mu-plugins -> ${SERVER_HOST}"
ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" \
  "mkdir -p '${INSTALL_ROOT}/mu-plugins' '${MU_PLUGIN_DEST}'"

rsync -avz -e "$RSYNC_SSH" \
  --exclude 'connection.env' \
  --include '*.sh' \
  --include 'mu-plugins/**' \
  --exclude '*' \
  "$SCRIPT_DIR/" "${SERVER_USER}@${SERVER_HOST}:${INSTALL_ROOT}/"

rsync -avz -e "$RSYNC_SSH" \
  "$SCRIPT_DIR/mu-plugins/" "${SERVER_USER}@${SERVER_HOST}:${INSTALL_ROOT}/mu-plugins/"

ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" "chmod +x ${INSTALL_ROOT}/*.sh"

TMP_CONFIG="$(mktemp)"
trap 'rm -f "$TMP_CONFIG"' EXIT

export BREVO_CFG_HOST="$HOST" BREVO_CFG_PORT="$PORT" BREVO_CFG_SECURE="$SECURE"
export BREVO_CFG_USER="$USER" BREVO_CFG_PASS="$SMTP_PASS"

node <<'NODE' >"$TMP_CONFIG"
const config = {
  host: process.env.BREVO_CFG_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.BREVO_CFG_PORT || 587),
  secure: process.env.BREVO_CFG_SECURE || 'tls',
  user: process.env.BREVO_CFG_USER || '',
  pass: process.env.BREVO_CFG_PASS || '',
  from_by_domain: {
    'oshercollective.com': {
      email: 'geral@oshercollective.com',
      name: 'Osher Collective',
    },
    'aamihe.com': {
      email: 'geral@aamihe.com',
      name: 'AAMIHE',
    },
  },
};

function exportPhp(value, indent = 0) {
  const pad = '    '.repeat(indent);
  const padIn = '    '.repeat(indent + 1);
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((v) => `${padIn}${exportPhp(v, indent + 1)},`).join('\n')}\n${pad}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return '[]';
  return `[\n${entries
    .map(([k, v]) => `${padIn}'${k}' => ${exportPhp(v, indent + 1)},`)
    .join('\n')}\n${pad}]`;
}

process.stdout.write(`<?php\nreturn ${exportPhp(config)};\n`);
NODE

echo "==> brevo-smtp-config.php (credenciais)"
scp -P "$SERVER_SSH_PORT" ${SSH_IDENTITY:+-i "$SSH_IDENTITY"} \
  "$TMP_CONFIG" "${SERVER_USER}@${SERVER_HOST}:${MU_PLUGIN_DEST}/brevo-smtp-config.php"
ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" \
  "chmod 640 '${MU_PLUGIN_DEST}/brevo-smtp-config.php'"

FILTER="${WP_DEPLOY_FILTER:-}"
echo "==> Symlinks mu-plugins${FILTER:+ (filtro: ${FILTER})}"
ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" \
  "INSTALL_ROOT='${INSTALL_ROOT}' MU_PLUGIN_DEST='${MU_PLUGIN_DEST}' WP_DEPLOY_FILTER='${FILTER}' \
   bash ${INSTALL_ROOT}/wp-deploy-mu-plugins.sh"

echo "Concluído."
