#!/usr/bin/env bash
# Injeta ProxyPass no vhost api.aamihe.com do DirectAdmin (método que funciona).
# Executar no servidor após rewrite_confs se o proxy deixar de funcionar.
set -euo pipefail

CONF="/usr/local/directadmin/data/users/admin/httpd.conf"
MARKER="127.0.0.1:8000"

if [[ ! -f "$CONF" ]]; then
  echo "Não encontrado: $CONF"
  exit 1
fi

if grep -q "$MARKER" "$CONF"; then
  echo "Proxy já presente em $CONF"
else
  cp -a "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)"
  sed -i '/ServerAlias www.api.aamihe.com api.aamihe.com/a\
	ProxyPreserveHost On\
	RequestHeader set X-Forwarded-Proto "https"\
	RequestHeader set X-Forwarded-Host "api.aamihe.com"\
	ProxyPass / http://127.0.0.1:8000/\
	ProxyPassReverse / http://127.0.0.1:8000/' "$CONF"
  echo "Proxy adicionado em $CONF"
fi

apachectl configtest
systemctl reload httpd
echo "Teste: curl -I https://api.aamihe.com  (esperado: Server: kong, 401)"
