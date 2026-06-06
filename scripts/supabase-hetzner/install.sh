#!/usr/bin/env bash
# Instala Supabase Docker no VPS Hetzner (só AAMIHE).
# Uso: bash install.sh supabase.visualdesignmoz.com
set -euo pipefail

API_DOMAIN="${1:-}"
if [[ -z "$API_DOMAIN" ]]; then
  echo "Uso: bash install.sh supabase.visualdesignmoz.com"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root."
  exit 1
fi

echo "==> Instalar Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  apt-get update && apt-get install -y docker-compose-plugin
fi

echo "==> Clonar Supabase..."
INSTALL_DIR="/opt/supabase-aamihe"
rm -rf "$INSTALL_DIR"
git clone --depth 1 https://github.com/supabase/supabase "$INSTALL_DIR"
cd "$INSTALL_DIR/docker"

cp .env.example .env

# URLs públicas (antes de gerar keys)
for var in SITE_URL API_EXTERNAL_URL SUPABASE_PUBLIC_URL; do
  if grep -q "^${var}=" .env; then
    sed -i "s|^${var}=.*|${var}=https://${API_DOMAIN}|" .env
  else
    echo "${var}=https://${API_DOMAIN}" >> .env
  fi
done

echo "==> Gerar secrets e JWT keys..."
sh ./utils/generate-keys.sh --update-env

echo "==> Arrancar Supabase (primeira vez demora vários minutos)..."
docker compose pull
docker compose up -d

echo ""
echo "============================================"
echo " Supabase AAMIHE — ${INSTALL_DIR}/docker"
echo "============================================"
echo ""
grep -E '^(ANON_KEY|SERVICE_ROLE_KEY|POSTGRES_PASSWORD|DASHBOARD_PASSWORD)=' .env || true
echo ""
echo "Próximos passos:"
echo "  1. DNS A: ${API_DOMAIN} -> IP deste VPS"
echo "  2. HTTPS (Caddy) -> localhost:8000"
echo "  3. scp aamihe-init.sql e: docker compose exec -T db psql -U postgres < /root/aamihe-init.sql"
echo "  4. Studio: https://${API_DOMAIN} (após HTTPS) ou http://IP:8000"
echo "============================================"
