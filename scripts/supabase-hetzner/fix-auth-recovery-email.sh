#!/usr/bin/env bash
# Corrige envio de email de recuperação de senha (Auth + Exim local).
# Executar no VPS como root, a partir da pasta deste script.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root no servidor (37.27.17.25)."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export ENV_FILE=/opt/supabase-aamihe/docker/.env
export COMPOSE_DIR=/opt/supabase-aamihe/docker

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Não encontrado: $ENV_FILE"
  exit 1
fi

echo "==> SMTP local (porta 25) + override Auth"
bash "${SCRIPT_DIR}/configure-smtp-env.sh"

echo ""
echo "==> URLs do site"
bash "${SCRIPT_DIR}/configure-auth-env.sh"

echo ""
echo "==> Variáveis efectivas no contentor auth:"
cd "$COMPOSE_DIR"
docker compose exec -T auth printenv | grep -E '^(GOTRUE_SMTP_|GOTRUE_MAILER_EXTERNAL)' || true

echo ""
echo "==> Teste ligação SMTP a partir do contentor (porta 25 no host):"
if docker compose exec -T auth sh -c 'nc -zv host.docker.internal 25 2>&1 || nc -zv 172.17.0.1 25 2>&1'; then
  echo "Porta 25 acessível."
else
  echo "AVISO: não foi possível ligar à porta 25. Tente: SMTP_HOST=172.17.0.1 bash configure-smtp-env.sh"
fi

echo ""
echo "Concluído. Aguarde 60s e teste «Repor senha» em https://aamihe.com/dashboard/login"
