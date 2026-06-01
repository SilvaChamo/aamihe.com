#!/usr/bin/env bash
# Instala proxy Apache para api.aamihe.com -> Supabase (127.0.0.1:8000)
# No Mac: scp ... root@IP:/root/ && ssh root@IP "bash /root/install-apache-proxy.sh"
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no servidor."
  exit 1
fi

CONF_NAME="api-aamihe-supabase.conf"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

SOURCE="${SCRIPT_DIR}/apache-api-aamihe.conf"
[[ -f "$SOURCE" ]] || SOURCE="/root/apache-api-aamihe.conf"
[[ -f "$SOURCE" ]] || { echo "Falta apache-api-aamihe.conf em /root/"; exit 1; }

HTTPD_ROOT="$(apachectl -V 2>/dev/null | awk -F'"' '/HTTPD_ROOT/ {print $2; exit}')"
SERVER_CONFIG="$(apachectl -V 2>/dev/null | awk -F'"' '/SERVER_CONFIG_FILE/ {print $2; exit}')"

if [[ -z "$HTTPD_ROOT" ]]; then
  echo "apachectl -V não devolveu HTTPD_ROOT"
  exit 1
fi

if [[ -n "$SERVER_CONFIG" && "$SERVER_CONFIG" != /* ]]; then
  SERVER_CONFIG="${HTTPD_ROOT}/${SERVER_CONFIG}"
fi

# DirectAdmin: ficheiro principal pode incluir admin noutro sítio
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

# Caminho absoluto — evita confusão com conf/ relativo
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

# Método 2: DirectAdmin vhost (necessário quando o Include extra não ganha prioridade)
PATCH="${SCRIPT_DIR}/patch-da-httpd-api-proxy.sh"
[[ -f "$PATCH" ]] || PATCH="/root/patch-da-httpd-api-proxy.sh"
if [[ -f "$PATCH" ]]; then
  bash "$PATCH"
else
  echo "Aviso: patch-da-httpd-api-proxy.sh não encontrado — envie com scp se curl ainda mostrar Apache HTML"
fi

echo ""
echo "Teste: curl -I https://api.aamihe.com  (esperado: Server: kong, 401)"
