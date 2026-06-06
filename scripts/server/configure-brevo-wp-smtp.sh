#!/usr/bin/env bash
# Gera brevo-smtp-config.php no servidor (credenciais fora do git).
#
#   SMTP_PASS='chave' bash configure-brevo-wp-smtp.sh
#
# Valores por defeito alinhados com .env.example / Brevo.
set -euo pipefail

MU_DEST="${MU_PLUGIN_DEST:-/usr/local/share/wordpress-mu-plugins}"
CONFIG="${MU_DEST}/brevo-smtp-config.php"

HOST="${SMTP_HOST:-smtp-relay.brevo.com}"
PORT="${SMTP_PORT:-587}"
SECURE="${SMTP_SECURE:-tls}"
USER="${SMTP_USER:-seu_login@smtp-brevo.com}"
PASS="${SMTP_PASS:-}"

if [[ -z "$PASS" ]]; then
  echo "Defina SMTP_PASS (chave SMTP do painel Brevo)."
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no VPS."
  exit 1
fi

mkdir -p "$MU_DEST"
chmod 755 "$MU_DEST"

php <<PHP
<?php
\$config = [
    'host' => ${HOST@Q},
    'port' => (int) ${PORT@Q},
    'secure' => ${SECURE@Q},
    'user' => ${USER@Q},
    'pass' => ${PASS@Q},
    'from_by_domain' => [
        'oshercollective.com' => [
            'email' => 'geral@oshercollective.com',
            'name' => 'Osher Collective',
        ],
        'aamihe.com' => [
            'email' => 'geral@aamihe.com',
            'name' => 'AAMIHE',
        ],
    ],
];
\$export = var_export(\$config, true);
file_put_contents('${CONFIG@Q}', "<?php\nreturn {$export};\n");
PHP

chmod 640 "$CONFIG"
chown root:root "$CONFIG" 2>/dev/null || true

echo "OK: $CONFIG"
