#!/usr/bin/env bash
# Bloqueia File Manager no DirectAdmin para uma conta (ex.: cliente Osher).
# Uso (no servidor, como root):
#   bash restrict-da-filemanager.sh oshercollective
set -euo pipefail

USER="${1:-}"
if [[ -z "$USER" ]]; then
  echo "Uso: $0 <username_directadmin>"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no VPS."
  exit 1
fi

USER_DIR="/usr/local/directadmin/data/users/${USER}"
if [[ ! -d "$USER_DIR" ]]; then
  echo "Conta inexistente: ${USER}"
  exit 1
fi

DENY="${USER_DIR}/commands.deny"
cat > "$DENY" <<'EOF'
# Sem File Manager — alterações técnicas só via agência (SSH / admin DirectAdmin)
CMD_FILE_MANAGER
CMD_API_FILE_MANAGER
CMD_FILE_MANAGER_EDIT
CMD_FILE_MANAGER_COPY
CMD_FILE_MANAGER_RENAME
CMD_FILE_MANAGER_PROTECT
CMD_FILE_MANAGER_EXTRACT
EOF
chown diradmin:diradmin "$DENY"
chmod 600 "$DENY"

UC="${USER_DIR}/user.conf"
if grep -q '^filemanager_disable_features=' "$UC"; then
  sed -i 's/^filemanager_disable_features=.*/filemanager_disable_features=131071/' "$UC"
else
  echo 'filemanager_disable_features=131071' >> "$UC"
fi

echo "OK  ${USER}"
echo "  ${DENY}"
echo "  filemanager_disable_features=131071 em user.conf"
