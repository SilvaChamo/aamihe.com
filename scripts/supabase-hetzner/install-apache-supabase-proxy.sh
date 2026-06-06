#!/usr/bin/env bash
# Proxy persistente: supabase.visualdesignmoz.com -> Kong (127.0.0.1:8000)
# No Mac:
#   scp -P 2234 scripts/supabase-hetzner/apache-supabase-visualdesignmoz.conf \
#     scripts/supabase-hetzner/install-apache-supabase-proxy.sh \
#     scripts/supabase-hetzner/patch-da-httpd-supabase-visualdesignmoz-proxy.sh root@37.27.17.25:/root/
#   ssh root@37.27.17.25 -p 2234 "bash /root/install-apache-supabase-proxy.sh"
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no servidor."
  exit 1
fi

CONF_NAME="supabase-visualdesignmoz.conf"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

SOURCE="${SCRIPT_DIR}/apache-supabase-visualdesignmoz.conf"
[[ -f "$SOURCE" ]] || SOURCE="/root/apache-supabase-visualdesignmoz.conf"
[[ -f "$SOURCE" ]] || { echo "Falta apache-supabase-visualdesignmoz.conf em /root/"; exit 1; }

HTTPD_ROOT="$(apachectl -V 2>/dev/null | awk -F'"' '/HTTPD_ROOT/ {print $2; exit}')"
SERVER_CONFIG="$(apachectl -V 2>/dev/null | awk -F'"' '/SERVER_CONFIG_FILE/ {print $2; exit}')"

if [[ -z "$HTTPD_ROOT" ]]; then
  echo "apachectl -V não devolveu HTTPD_ROOT"
  exit 1
fi

if [[ -n "$SERVER_CONFIG" && "$SERVER_CONFIG" != /* ]]; then
  SERVER_CONFIG="${HTTPD_ROOT}/${SERVER_CONFIG}"
fi

if [[ ! -f "$SERVER_CONFIG" ]]; then
  for candidate in \
    /etc/httpd/conf/httpd.conf \
    /usr/local/apache/conf/httpd.conf \
    "${HTTPD_ROOT}/conf/httpd.conf"; do
    if [[ -f "$candidate" ]]; then
      SERVER_CONFIG="$candidate"
      break
    fi
  done
fi

if [[ ! -f "$SERVER_CONFIG" ]]; then
  FOUND="$(grep -rl 'users/admin/httpd.conf' /etc/httpd /usr/local/apache/conf 2>/dev/null | head -1)"
  [[ -n "$FOUND" ]] && SERVER_CONFIG="$FOUND"
fi

if [[ ! -f "$SERVER_CONFIG" ]]; then
  echo "httpd.conf principal não encontrado. Corra: apachectl -V"
  exit 1
fi

EXTRA_DIR="${HTTPD_ROOT}/conf/extra"
mkdir -p "$EXTRA_DIR"
DEST="${EXTRA_DIR}/${CONF_NAME}"
cp "$SOURCE" "$DEST"
chmod 644 "$DEST"

INCLUDE_LINE="Include ${DEST}"
if ! grep -qF "$DEST" "$SERVER_CONFIG" 2>/dev/null; then
  if grep -q 'users/admin/httpd.conf' "$SERVER_CONFIG"; then
    sed -i "/users\\/admin\\/httpd.conf/i ${INCLUDE_LINE}" "$SERVER_CONFIG"
  else
    echo "$INCLUDE_LINE" >> "$SERVER_CONFIG"
  fi
  echo "Include adicionado em: ${SERVER_CONFIG}"
else
  echo "Include já existia em: ${SERVER_CONFIG}"
fi

apachectl configtest
systemctl reload httpd

PATCH="${SCRIPT_DIR}/patch-da-httpd-supabase-visualdesignmoz-proxy.sh"
[[ -f "$PATCH" ]] || PATCH="/root/patch-da-httpd-supabase-visualdesignmoz-proxy.sh"
if [[ -f "$PATCH" ]]; then
  bash "$PATCH"
else
  echo "Aviso: patch-da-httpd-supabase-visualdesignmoz-proxy.sh não encontrado"
fi

echo ""
echo "Teste: curl -I https://supabase.visualdesignmoz.com  (esperado: Server: kong, 401)"
