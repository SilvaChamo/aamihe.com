#!/bin/bash
# Executa comando no servidor. Uso: ./remote.sh 'comando'
# Exemplo: ./remote.sh 'hostname && uptime'
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=connection.env
source "$SCRIPT_DIR/connection.env"

SSH_OPTS=(-p "$SERVER_SSH_PORT" -o ConnectTimeout=15 -o ServerAliveInterval=30)
if [[ -n "${SSH_IDENTITY:-}" && -f "${SSH_IDENTITY}" ]]; then
  SSH_OPTS+=(-i "$SSH_IDENTITY" -o BatchMode=yes)
fi

if [[ $# -eq 0 ]]; then
  exec ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}"
fi

exec ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" "$@"
