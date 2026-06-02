#!/usr/bin/env bash
# Igual a fix-exim-ipv4-outbound.sh — usar se só copiar este ficheiro para /root/
set -euo pipefail
EXIM_CONF=/etc/exim.conf
VARS_CONF=/etc/exim.variables.conf
oldest_bak=$(ls -t /etc/exim.conf.bak.* 2>/dev/null | tail -1 || true)
[[ -n "$oldest_bak" && -f "$oldest_bak" ]] && cp -a "$oldest_bak" "$EXIM_CONF" && echo "Restaurado: $oldest_bak"
sed -i '/AAMIHE/d;/exim.conf.custom/d;/^disable_ipv6[[:space:]]*=/d' "$EXIM_CONF" 2>/dev/null || true
[[ -f /etc/exim.conf.custom ]] && mv /etc/exim.conf.custom "/etc/exim.conf.custom.broken.$(date +%s)"
if [[ -f "$VARS_CONF" ]] && ! grep -qE '^[[:space:]]*disable_ipv6' "$VARS_CONF"; then
  sed -i '1idisable_ipv6 = true' "$VARS_CONF"
fi
exim -bV
systemctl restart exim 2>/dev/null || service exim restart
exim -bt silva.chamo@gmail.com | head -15
exim -qff 2>/dev/null || exim -q
echo OK
