#!/usr/bin/env bash
# Aponta .env.local para chaves do Supabase Hetzner (sem hardcode no repo).
# Uso: bash scripts/supabase-hetzner/switch-env-keys.sh
set -euo pipefail

ENV_FILE="${1:-.env.local}"
REMOTE_ENV="${REMOTE_ENV:-/opt/supabase-aamihe/docker/.env}"
SSH_HOST="${SSH_HOST:-root@37.27.17.25}"
SSH_PORT="${SSH_PORT:-2234}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/aamihe_hetzner}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta $ENV_FILE"
  exit 1
fi

read_var() {
  ssh -p "$SSH_PORT" -i "$SSH_KEY" "$SSH_HOST" "grep '^$1=' $REMOTE_ENV | cut -d= -f2-"
}

ANON=$(read_var ANON_KEY)
SERVICE=$(read_var SERVICE_ROLE_KEY)
URL="https://supabase.visualdesignmoz.com"

python3 - "$ENV_FILE" "$URL" "$ANON" "$SERVICE" <<'PY'
import re, sys
path, url, anon, service = sys.argv[1:5]
text = open(path).read()
for key, val in [
    ('NEXT_PUBLIC_SUPABASE_URL', url),
    ('NEXT_PUBLIC_SUPABASE_ANON_KEY', anon),
    ('SUPABASE_SERVICE_ROLE_KEY', service),
]:
    if re.search(rf'^{re.escape(key)}=', text, re.M):
        text = re.sub(rf'^{re.escape(key)}=.*$', f'{key}={val}', text, flags=re.M)
    else:
        text += f'\n{key}={val}\n'
open(path, 'w').write(text)
PY

echo "OK: $ENV_FILE actualizado com chaves do Hetzner (via SSH)."
