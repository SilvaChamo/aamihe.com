#!/bin/bash
# Executa comando no servidor. Uso: ./remote.sh 'comando'
# Exemplo: ./remote.sh 'hostname && uptime'
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=connection.env
source "$SCRIPT_DIR/connection.env"

if [[ $# -eq 0 ]]; then
  exec ssh -p "$SERVER_SSH_PORT" -o ConnectTimeout=15 -o ServerAliveInterval=30 \
    "${SERVER_USER}@${SERVER_HOST}"
fi

exec ssh -p "$SERVER_SSH_PORT" -o ConnectTimeout=15 -o ServerAliveInterval=30 \
  "${SERVER_USER}@${SERVER_HOST}" "$@"
