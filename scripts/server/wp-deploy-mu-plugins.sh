#!/usr/bin/env bash
# Liga mu-plugins centrais a todos os WordPress no DirectAdmin (symlinks).
#
# No servidor:
#   bash /root/aamihe-server-scripts/wp-deploy-mu-plugins.sh
#
# Só um site (ex.: oshercollective.com):
#   WP_DEPLOY_FILTER=oshercollective.com bash wp-deploy-mu-plugins.sh
set -euo pipefail

MU_DEST="${MU_PLUGIN_DEST:-/usr/local/share/wordpress-mu-plugins}"
INSTALL_ROOT="${INSTALL_ROOT:-/root/aamihe-server-scripts}"
FILTER="${WP_DEPLOY_FILTER:-}"

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no VPS."
  exit 1
fi

if [[ -d "${INSTALL_ROOT}/mu-plugins" ]]; then
  mkdir -p "$MU_DEST"
  rsync -a --delete "${INSTALL_ROOT}/mu-plugins/" "$MU_DEST/" \
    --exclude 'brevo-smtp-config.example.php' \
    --exclude 'brevo-smtp-config.php'
fi

if [[ ! -d "$MU_DEST" ]]; then
  echo "Pasta central inexistente: $MU_DEST"
  exit 1
fi

mapfile -t WP_ROOTS < <(
  find /home -path '*/public_html/wp-config.php' 2>/dev/null \
    | grep -v '/Backup/' \
    | sed 's|/wp-config.php$||'
)

if [[ ${#WP_ROOTS[@]} -eq 0 ]]; then
  echo "Nenhum WordPress encontrado em /home."
  exit 1
fi

linked=0
for wp_root in "${WP_ROOTS[@]}"; do
  if [[ -n "$FILTER" && "$wp_root" != *"/domains/${FILTER}/"* ]]; then
    continue
  fi

  mu_dir="${wp_root}/wp-content/mu-plugins"
  mkdir -p "$mu_dir"

  for src in "$MU_DEST"/*.php; do
    [[ -f "$src" ]] || continue
    base="$(basename "$src")"
    if [[ "$base" == 'brevo-smtp-config.example.php' || "$base" == 'brevo-smtp-config.php' ]]; then
      continue
    fi
    ln -sfn "$src" "${mu_dir}/${base}"
  done

  echo "OK  ${wp_root}"
  linked=$((linked + 1))
done

echo ""
echo "Sites ligados: ${linked}"
echo "Config Brevo: ${MU_DEST}/brevo-smtp-config.php"
