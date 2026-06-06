#!/usr/bin/env bash
# Activa proxy Supabase em supabase.visualdesignmoz.com (servidor Visual Design).
# Pré-requisitos: subdomínio DirectAdmin + SSL Let's Encrypt
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
URL="https://supabase.visualdesignmoz.com"

echo "==> URLs no Docker"
bash "${SCRIPT_DIR}/update-docker-public-url.sh" "$URL"

echo ""
echo "==> Proxy Apache (DirectAdmin)"
bash "${SCRIPT_DIR}/patch-da-httpd-supabase-visualdesignmoz-proxy.sh"

echo ""
echo "==> Concluído"
echo "No Mac: actualize .env.local e Vercel:"
echo "  NEXT_PUBLIC_SUPABASE_URL=${URL}"
echo ""
echo "Teste: curl -I ${URL}"
