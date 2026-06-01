#!/usr/bin/env bash
# Proxy DirectAdmin: supabase.aamihe.com -> 127.0.0.1:8000
# Correr DEPOIS de criar subdomínio supabase + SSL + rewrite_confs (se necessário).
set -euo pipefail

CONF="/usr/local/directadmin/data/users/admin/httpd.conf"
HOST="supabase.aamihe.com"
MARKER="X-Forwarded-Host \"supabase.aamihe.com\""

if [[ ! -f "$CONF" ]]; then
  echo "Não encontrado: $CONF"
  exit 1
fi

if ! grep -q "ServerAlias www.supabase.aamihe.com supabase.aamihe.com" "$CONF"; then
  echo "Subdomínio supabase ainda não está no httpd.conf."
  echo "Crie supabase.aamihe.com no DirectAdmin e corra: cd /usr/local/directadmin/custombuild && ./build rewrite_confs"
  exit 1
fi

if grep -q "$MARKER" "$CONF"; then
  echo "Proxy supabase já presente."
else
  cp -a "$CONF" "${CONF}.bak.supabase.$(date +%Y%m%d%H%M%S)"
  sed -i '/ServerAlias www.supabase.aamihe.com supabase.aamihe.com/a\
	ProxyPreserveHost On\
	RequestHeader set X-Forwarded-Proto "https"\
	RequestHeader set X-Forwarded-Host "supabase.aamihe.com"\
	ProxyPass / http://127.0.0.1:8000/\
	ProxyPassReverse / http://127.0.0.1:8000/' "$CONF"
  echo "Proxy adicionado para supabase.aamihe.com"
fi

apachectl configtest
systemctl reload httpd
echo "Teste: curl -I https://supabase.aamihe.com  (esperado: Server: kong, 401)"
