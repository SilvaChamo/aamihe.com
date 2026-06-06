#!/usr/bin/env bash
# Bloqueia FTP por defeito no servidor (CSF + pure-ftpd + DirectAdmin).
# Uso no VPS como root: bash disable-ftp-server-default.sh
# Para activar FTP para um cliente: bash enable-ftp-client.sh <username> [ip_opcional]
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no VPS."
  exit 1
fi

CSF=/etc/csf/csf.conf
cp -a "$CSF" "${CSF}.bak-$(date +%Y%m%d-%H%M)"

python3 <<'PY'
from pathlib import Path
import re

path = Path("/etc/csf/csf.conf")
lines = []
for line in path.read_text().splitlines():
    m = re.match(r"^(TCP6?_IN|TCP6?_OUT)\s*=\s*\"([^\"]+)\"(.*)$", line)
    if not m:
        lines.append(line)
        continue
    key, ports, tail = m.group(1), m.group(2), m.group(3)
    drop = {"20", "21", "35000:35999"}
    seen = set()
    out = []
    for p in (x.strip() for x in ports.split(",") if x.strip()):
        if p in drop or p in seen:
            continue
        seen.add(p)
        out.append(p)
    lines.append(f'{key} = "{",".join(out)}"{tail}')
path.write_text("\n".join(lines) + "\n")
print("CSF: portas 20, 21 e 35000:35999 removidas")
PY

csf -r

systemctl stop pure-ftpd 2>/dev/null || true
systemctl disable pure-ftpd 2>/dev/null || true
systemctl mask pure-ftpd 2>/dev/null || true

/usr/local/directadmin/directadmin config-set pureftp 0

PKG=/usr/local/directadmin/data/users/admin/packages/VisualDESIGN.pkg
if [[ -f "$PKG" ]]; then
  if grep -q '^ftp=' "$PKG"; then
    sed -i 's/^ftp=.*/ftp=0/' "$PKG"
  else
    echo 'ftp=0' >> "$PKG"
  fi
fi

echo ""
echo "FTP bloqueado por defeito no servidor."
echo "DirectAdmin pureftp=0 | pacote VisualDESIGN ftp=0"
grep -E '^TCP_IN|^TCP6_IN' "$CSF"
