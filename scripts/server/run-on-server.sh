#!/bin/bash
# Envia um script .sh para o VPS e executa como root (porta 2234).
#
# Uso (na pasta scripts/server):
#   ./run-on-server.sh fix-exim-ipv4-outbound.sh
#
# Entrada SSH explícita (na pasta do projecto):
#   ssh root@37.27.17.25 -p 2234 'bash -s' < scripts/server/fix-exim-ipv4-outbound.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=connection.env
source "$SCRIPT_DIR/connection.env"

REMOTE_SCRIPT="${1:-}"
if [[ -z "$REMOTE_SCRIPT" ]]; then
  echo "Uso: $0 <ficheiro.sh>"
  echo "Exemplo: $0 fix-exim-ipv4-outbound.sh"
  exit 1
fi

LOCAL="${SCRIPT_DIR}/${REMOTE_SCRIPT}"
if [[ ! -f "$LOCAL" ]]; then
  echo "Não encontrado: $LOCAL"
  exit 1
fi

SSH_OPTS=(-p "$SERVER_SSH_PORT" -o ConnectTimeout=15 -o ServerAliveInterval=30)
if [[ -n "${SSH_IDENTITY:-}" && -f "${SSH_IDENTITY}" ]]; then
  SSH_OPTS+=(-i "$SSH_IDENTITY" -o BatchMode=yes)
fi

echo "==> ${SERVER_USER}@${SERVER_HOST}:${SERVER_SSH_PORT} ← ${REMOTE_SCRIPT}"
exec ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" 'bash -s' < "$LOCAL"
