#!/bin/bash
# Envia scripts/server para o servidor (porta SSH 2234).
# Uso: ./push-to-server.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=connection.env
source "$SCRIPT_DIR/connection.env"

echo "==> ${SERVER_USER}@${SERVER_HOST}:${SERVER_SSH_PORT}"
echo "    scripts -> ${INSTALL_ROOT}"

"$SCRIPT_DIR/remote.sh" "mkdir -p '${INSTALL_ROOT}' '${MU_PLUGIN_DEST}'"

rsync -avz \
  -e "$RSYNC_SSH" \
  --exclude 'connection.env' \
  --include '*.sh' \
  --exclude '*' \
  "$SCRIPT_DIR/" "${SERVER_USER}@${SERVER_HOST}:${INSTALL_ROOT}/"

rsync -avz \
  -e "$RSYNC_SSH" \
  "$SCRIPT_DIR/mu-plugins/" "${SERVER_USER}@${SERVER_HOST}:${MU_PLUGIN_DEST}/"

"$SCRIPT_DIR/remote.sh" "chmod +x ${INSTALL_ROOT}/*.sh"

echo "Concluído. Entrar: ./remote.sh"
