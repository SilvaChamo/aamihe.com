#!/usr/bin/env bash
# Migra Supabase público: supabase.aamihe.com -> supabase.visualdesignmoz.com
# Remove subdomínio supabase.aamihe.com do Apache/DirectAdmin.
set -euo pipefail

PUBLIC_URL="${PUBLIC_URL:-https://supabase.visualdesignmoz.com}"
SITE_URL="${SITE_URL:-https://aamihe.com}"
CONF="/usr/local/directadmin/data/users/admin/httpd.conf"
COMPOSE_DIR="/opt/supabase-aamihe/docker"
ENV_FILE="${COMPOSE_DIR}/.env"
MARKER_VDM='X-Forwarded-Host "supabase.visualdesignmoz.com"'

if [[ ! -f "$CONF" ]]; then
  echo "Não encontrado: $CONF"
  exit 1
fi

backup="${CONF}.bak.migrate-vdm.$(date +%Y%m%d%H%M%S)"
cp -a "$CONF" "$backup"
echo "Backup: $backup"

# 1) Proxy Kong no subdomínio visualdesignmoz (443)
if grep -q "$MARKER_VDM" "$CONF"; then
  echo "Proxy visualdesignmoz já presente."
else
  sed -i '/ServerAlias www.supabase.visualdesignmoz.com supabase.visualdesignmoz.com/a\
	ProxyPreserveHost On\
	RequestHeader set X-Forwarded-Proto "https"\
	RequestHeader set X-Forwarded-Host "supabase.visualdesignmoz.com"\
	ProxyPass / http://127.0.0.1:8000/\
	ProxyPassReverse / http://127.0.0.1:8000/' "$CONF"
  echo "Proxy adicionado para supabase.visualdesignmoz.com"
fi

# 2) Remover vhosts supabase.aamihe.com do httpd.conf
python3 - <<'PY'
from pathlib import Path
import re

conf = Path("/usr/local/directadmin/data/users/admin/httpd.conf")
text = conf.read_text()
pattern = re.compile(
    r"<VirtualHost[^>]*>\s*"
    r"(?:(?!</VirtualHost>).)*?"
    r"ServerAlias www\.supabase\.aamihe\.com supabase\.aamihe\.com"
    r"(?:(?!</VirtualHost>).)*?"
    r"</VirtualHost>\s*",
    re.DOTALL,
)
new_text, n = pattern.subn("", text)
if n == 0:
    raise SystemExit("Nenhum bloco supabase.aamihe.com encontrado para remover.")
conf.write_text(new_text)
print(f"Removidos {n} bloco(s) VirtualHost supabase.aamihe.com")
PY

# 3) Desactivar conf extra legado aamihe (se existir)
for f in /etc/httpd/conf/extra/supabase-aamihe.conf; do
  if [[ -f "$f" ]]; then
    mv "$f" "${f}.disabled.$(date +%Y%m%d%H%M%S)"
    echo "Desactivado: $f"
  fi
done

# 4) URLs Docker
for var in API_EXTERNAL_URL SUPABASE_PUBLIC_URL; do
  if grep -q "^${var}=" "$ENV_FILE"; then
    sed -i "s|^${var}=.*|${var}=${PUBLIC_URL}|" "$ENV_FILE"
  else
    echo "${var}=${PUBLIC_URL}" >> "$ENV_FILE"
  fi
done

if grep -q "^SITE_URL=" "$ENV_FILE"; then
  sed -i "s|^SITE_URL=.*|SITE_URL=${SITE_URL}|" "$ENV_FILE"
fi

# GOTRUE mailer hosts no override
OVERRIDE="${COMPOSE_DIR}/docker-compose.override.yml"
if [[ -f "$OVERRIDE" ]]; then
  sed -i 's|GOTRUE_MAILER_EXTERNAL_HOSTS:.*|GOTRUE_MAILER_EXTERNAL_HOSTS: supabase.visualdesignmoz.com,aamihe.com|' "$OVERRIDE"
fi

cd "$COMPOSE_DIR"
docker compose up -d

apachectl configtest
systemctl reload httpd

# 5) Apagar subdomínio supabase.aamihe.com no DirectAdmin
if [[ -d /usr/local/directadmin ]]; then
  if [[ -f /usr/local/directadmin/scripts/delete_subdomain.sh ]]; then
    /usr/local/directadmin/scripts/delete_subdomain.sh aamihe.com supabase admin 2>/dev/null || true
  fi
  # fallback API interna
  echo "action=delete&domain=aamihe.com&subdomain=supabase" > /usr/local/directadmin/data/task_queue 2>/dev/null || true
fi

rm -rf /home/admin/domains/supabase.aamihe.com 2>/dev/null || true

echo ""
echo "=== Testes ==="
curl -sI "https://supabase.visualdesignmoz.com" | head -5
echo "---"
curl -sI "https://supabase.aamihe.com" | head -5 || echo "(supabase.aamihe.com inacessível — OK)"
echo ""
grep -E '^(SITE_URL|API_EXTERNAL_URL|SUPABASE_PUBLIC_URL)=' "$ENV_FILE"
