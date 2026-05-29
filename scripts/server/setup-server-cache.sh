#!/bin/bash
# Instalação completa no servidor: WP-CLI, plugins no site principal, cron, MariaDB.
#
# No Mac (porta SSH 2234 — ver connection.env):
#   cd scripts/server && ./push-to-server.sh
#   ./remote.sh "export WP_PATH=/home/USER/domains/aamihe.com/public_html && ${INSTALL_ROOT:-/root/aamihe-server-scripts}/setup-server-cache.sh"
#
# Já no servidor como root:
#   export WP_PATH=/home/USER/domains/aamihe.com/public_html
#   ./setup-server-cache.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_ROOT="${INSTALL_ROOT:-/root/aamihe-server-scripts}"

mkdir -p "$INSTALL_ROOT"
cp "$SCRIPT_DIR"/*.sh "$INSTALL_ROOT/"
chmod +x "$INSTALL_ROOT"/*.sh

echo "==> WP-CLI"
"$INSTALL_ROOT/install-wp-cli.sh"

echo "==> MariaDB"
"$INSTALL_ROOT/mariadb-wordpress-tune.sh" || echo "    (MariaDB ignorado se não local)"

if [[ -n "${WP_PATH:-}" && -f "${WP_PATH}/wp-config.php" ]]; then
  echo "==> WordPress principal: $WP_PATH"
  "$INSTALL_ROOT/wp-cache-plugins.sh" "$WP_PATH"
else
  echo "==> WP_PATH não definido — só scan automático."
  echo "    Para o site principal: export WP_PATH=/home/.../public_html && $INSTALL_ROOT/wp-cache-plugins.sh \"\$WP_PATH\""
fi

CRON_LINE="0 4 * * 0 $INSTALL_ROOT/wp-cache-plugins-scan.sh >> /var/log/wp-cache-bootstrap.log 2>&1"
if ! crontab -l 2>/dev/null | grep -qF "wp-cache-plugins-scan.sh"; then
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "==> Cron semanal activado (domingos 04:00)"
fi

echo "==> Ficheiros em $INSTALL_ROOT"
echo "Concluído."
