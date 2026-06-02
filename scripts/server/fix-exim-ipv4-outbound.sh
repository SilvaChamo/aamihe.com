#!/usr/bin/env bash
# Repara Exim após tentativas anteriores. DirectAdmin: disable_ipv6 costuma estar
# só em /etc/exim.variables.conf — NÃO duplicar em exim.conf.
#
# ssh root@37.27.17.25 -p 2234 'bash -s' < scripts/server/fix-exim-ipv4-outbound.sh
#
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no VPS."
  exit 1
fi

EXIM_CONF="/etc/exim.conf"
VARS_CONF="/etc/exim.variables.conf"
MARK="AAMIHE"

echo "==> 1. Restaurar exim.conf (backup mais antigo AAMIHE)"
oldest_bak="$(ls -t /etc/exim.conf.bak.* 2>/dev/null | tail -1 || true)"
if [[ -z "$oldest_bak" ]]; then
  oldest_bak="$(ls -t /etc/exim.conf.bak.* 2>/dev/null | head -1 || true)"
fi
if [[ -n "$oldest_bak" && -f "$oldest_bak" ]]; then
  cp -a "$oldest_bak" "$EXIM_CONF"
  echo "Restaurado: $oldest_bak"
fi

sed -i "/${MARK}/d" "$EXIM_CONF" 2>/dev/null || true
sed -i '\|exim.conf.custom|d' "$EXIM_CONF" 2>/dev/null || true
sed -i '/^disable_ipv6[[:space:]]*=/d' "$EXIM_CONF" 2>/dev/null || true

[[ -f /etc/exim.conf.custom ]] && \
  mv -f /etc/exim.conf.custom "/etc/exim.conf.custom.broken.$(date +%s)" 2>/dev/null || true

echo "==> 2. disable_ipv6=true em exim.variables.conf"
if [[ -f "$VARS_CONF" ]]; then
  cp -a "$VARS_CONF" "${VARS_CONF}.bak.$(date +%Y%m%d%H%M%S)"
  if grep -qE '^[[:space:]]*disable_ipv6[[:space:]]*=' "$VARS_CONF"; then
    sed -i 's/^[[:space:]]*disable_ipv6[[:space:]]*=.*/disable_ipv6=true/' "$VARS_CONF"
    echo "disable_ipv6=true em $VARS_CONF (era false?)"
  else
    echo 'disable_ipv6=true' >>"$VARS_CONF"
    echo "Adicionado disable_ipv6=true"
  fi
  grep disable_ipv6 "$VARS_CONF"
else
  echo "AVISO: $VARS_CONF não encontrado"
fi

echo "==> 3. Validar"
exim -bV

echo "==> 4. Reiniciar e testar"
systemctl restart exim 2>/dev/null || service exim restart
exim -bt silva.chamo@gmail.com 2>&1 | head -20
exim -qff 2>/dev/null || exim -q
echo ""
echo "OK — teste envio no Roundcube."
