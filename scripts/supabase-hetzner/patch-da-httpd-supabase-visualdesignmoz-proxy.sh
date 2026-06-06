#!/usr/bin/env bash
# Proxy DirectAdmin: supabase.visualdesignmoz.com -> 127.0.0.1:8000
set -euo pipefail

CONF="/usr/local/directadmin/data/users/admin/httpd.conf"
MARKER='X-Forwarded-Host "supabase.visualdesignmoz.com"'

if [[ ! -f "$CONF" ]]; then
  echo "Não encontrado: $CONF"
  exit 1
fi

if ! grep -q "ServerAlias www.supabase.visualdesignmoz.com supabase.visualdesignmoz.com" "$CONF"; then
  echo "Subdomínio supabase.visualdesignmoz.com ainda não está no httpd.conf."
  exit 1
fi

if grep -q "$MARKER" "$CONF"; then
  echo "Proxy supabase.visualdesignmoz já presente."
else
  cp -a "$CONF" "${CONF}.bak.supabase-vdm.$(date +%Y%m%d%H%M%S)"
  sed -i '/ServerAlias www.supabase.visualdesignmoz.com supabase.visualdesignmoz.com/a\
	ProxyPreserveHost On\
	RequestHeader set X-Forwarded-Proto "https"\
	RequestHeader set X-Forwarded-Host "supabase.visualdesignmoz.com"\
	ProxyPass / http://127.0.0.1:8000/\
	ProxyPassReverse / http://127.0.0.1:8000/' "$CONF"
  echo "Proxy adicionado para supabase.visualdesignmoz.com"
fi

apachectl configtest
systemctl reload httpd
echo "Teste: curl -I https://supabase.visualdesignmoz.com  (esperado: Server: kong, 401)"
