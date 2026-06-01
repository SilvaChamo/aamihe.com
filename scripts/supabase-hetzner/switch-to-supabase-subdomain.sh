#!/usr/bin/env bash
# AAMIHE: api.aamihe.com -> supabase.aamihe.com (servidor)
# Pré-requisitos: DNS A supabase + subdomínio DirectAdmin + SSL Let's Encrypt
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
URL="https://supabase.aamihe.com"

echo "==> URLs no Docker"
bash "${SCRIPT_DIR}/update-docker-public-url.sh" "$URL"

echo ""
echo "==> Proxy Apache (DirectAdmin)"
bash "${SCRIPT_DIR}/patch-da-httpd-supabase-proxy.sh"

echo ""
echo "==> Concluído"
echo "No Mac: actualize .env.local e Vercel:"
echo "  NEXT_PUBLIC_SUPABASE_URL=${URL}"
echo "  SUPABASE_HETZNER_URL=${URL}"
echo ""
echo "Studio Auth redirect URLs: use ${URL} onde tinha api.aamihe.com"
echo "Teste: curl -I ${URL}"
