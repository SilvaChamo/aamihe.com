#!/usr/bin/env bash
# Activa FTP para um cliente (quando solicitar). Requer root no VPS.
# Uso: bash enable-ftp-client.sh <username_directadmin> [limite_contas]
# Exemplo: bash enable-ftp-client.sh oshercollective 5
set -euo pipefail

USER="${1:-}"
LIMIT="${2:-5}"

if [[ -z "$USER" ]]; then
  echo "Uso: $0 <username_directadmin> [limite_contas_ftp]"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no VPS."
  exit 1
fi

UC="/usr/local/directadmin/data/users/${USER}/user.conf"
if [[ ! -f "$UC" ]]; then
  echo "Conta inexistente: ${USER}"
  exit 1
fi

CSF=/etc/csf/csf.conf

ensure_csf_ports() {
  python3 <<'PY'
from pathlib import Path
import re

path = Path("/etc/csf/csf.conf")
add_in = ["20", "21", "35000:35999"]
add_out = ["20", "21"]

def merge_ports(line: str, extra: list[str]) -> str:
    m = re.match(r"^(TCP6?_IN|TCP6?_OUT)\s*=\s*\"([^\"]+)\"(.*)$", line)
    if not m:
        return line
    key, ports, tail = m.group(1), m.group(2), m.group(3)
    items = [p.strip() for p in ports.split(",") if p.strip()]
    for p in extra:
        if p not in items:
            items.append(p)
    return f'{key} = "{",".join(items)}"{tail}'

lines = []
for line in path.read_text().splitlines():
    if line.startswith(("TCP_IN ", "TCP6_IN ")):
        lines.append(merge_ports(line, add_in))
    elif line.startswith(("TCP_OUT ", "TCP6_OUT ")):
        lines.append(merge_ports(line, add_out))
    else:
        lines.append(line)
path.write_text("\n".join(lines) + "\n")
PY
}

systemctl unmask pure-ftpd 2>/dev/null || true
systemctl enable pure-ftpd 2>/dev/null || true
systemctl start pure-ftpd 2>/dev/null || service pure-ftpd start

/usr/local/directadmin/directadmin config-set pureftp 1
ensure_csf_ports
csf -r

if grep -q '^ftp=' "$UC"; then
  sed -i "s/^ftp=.*/ftp=${LIMIT}/" "$UC"
else
  echo "ftp=${LIMIT}" >> "$UC"
fi

echo "OK  FTP activo para ${USER} (limite ${LIMIT} contas)"
echo "Portas CSF: 20, 21, 35000:35999"
grep '^ftp=' "$UC"
