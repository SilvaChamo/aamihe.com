#!/usr/bin/env bash
# Revisão: email do site (Vercel → mail.aamihe.com) + Auth (Supabase → Exim local).
#
# Local (Mac):
#   bash scripts/email/review-email-config.sh
#
# No VPS:
#   scp -P 2234 scripts/email/review-email-config.sh root@37.27.17.25:/root/
#   ssh root@37.27.17.25 -p 2234 'bash /root/review-email-config.sh --server'
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SERVER_MODE=false
[[ "${1:-}" == "--server" ]] && SERVER_MODE=true

ok() { echo "  OK  $*"; }
warn() { echo "  AVISO  $*"; }
fail() { echo "  FALHA  $*"; }

review_vercel() {
  echo "==> Vercel (site: newsletters, notificações, formulários)"
  if ! command -v vercel >/dev/null 2>&1 && ! command -v npx >/dev/null 2>&1; then
    warn "CLI Vercel não encontrada. Revise no painel: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS."
    return
  fi
  cd "$REPO_ROOT"
  local required=(SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SITE_EMAIL_FROM)
  local listed
  listed="$(npx vercel env ls production 2>/dev/null || true)"
  for key in "${required[@]}"; do
    if echo "$listed" | grep -qE "^[[:space:]]*${key}[[:space:]]"; then
      ok "$key existe em Production"
    else
      fail "$key em falta na Vercel Production"
    fi
  done
  echo ""
  echo "  Confirme valores no painel (pull local pode vir vazio para secrets)."
  echo "  SMTP_PASS: palavra-passe de noreply@aamihe.com no DirectAdmin."
  echo "  Após alterar variáveis, faça redeploy em Production."
  echo ""
  echo "  Repor senha na Vercel: GoTrue no VPS (PASSWORD_RESET_USE_SITE_SMTP não é true)."
  echo "  Conta: noreply@aamihe.com criada no DirectAdmin → E-mail Accounts."
}

review_server() {
  echo "==> VPS — Supabase Auth (Exim local, mesmo caminho que PHP/DirectAdmin)"
  local env_file="${ENV_FILE:-/opt/supabase-aamihe/docker/.env}"
  local compose_dir="${COMPOSE_DIR:-/opt/supabase-aamihe/docker}"

  if [[ ! -f "$env_file" ]]; then
    fail "Não encontrado: $env_file"
    return
  fi

  # shellcheck disable=SC1090
  source <(grep -E '^SMTP_' "$env_file" | sed 's/^/export /')

  if [[ "${SMTP_HOST:-}" == "172.17.0.1" && "${SMTP_PORT:-}" == "25" ]]; then
    ok "SMTP local Docker → Exim (172.17.0.1:25)"
  elif [[ -z "${SMTP_USER:-}" && "${SMTP_PORT:-}" == "25" ]]; then
    ok "SMTP sem auth na porta 25 (Exim local)"
  elif [[ "${SMTP_HOST:-}" == "mail.aamihe.com" ]]; then
    warn "Auth em modo remoto; se 587 falhar, execute fix-auth-recovery-email.sh"
  else
    warn "SMTP_HOST=${SMTP_HOST:-?} PORT=${SMTP_PORT:-?} — esperado 172.17.0.1:25"
  fi

  if systemctl is-active exim >/dev/null 2>&1 || systemctl is-active exim4 >/dev/null 2>&1; then
    ok "Exim activo no host"
  else
    fail "Exim inactivo — systemctl status exim"
  fi

  if [[ -d "$compose_dir" ]]; then
    cd "$compose_dir"
    if docker compose exec -T auth printenv 2>/dev/null | grep -q GOTRUE_SMTP_HOST; then
      ok "Contentor auth com GOTRUE_SMTP_*"
      docker compose exec -T auth printenv 2>/dev/null | grep -E '^GOTRUE_SMTP_(HOST|PORT|ADMIN_EMAIL)=' | sed 's/=.*/=***/' || true
    else
      warn "GOTRUE_SMTP_* ausente — bash scripts/supabase-hetzner/configure-smtp-env.sh"
    fi
    if docker compose exec -T auth sh -c 'nc -zv 172.17.0.1 25 2>&1' >/dev/null 2>&1; then
      ok "Auth alcança porta 25 no host"
    else
      fail "Auth não alcança 172.17.0.1:25 — execute fix-auth-recovery-email.sh"
    fi
  fi
}

echo "Revisão de email AAMIHE"
echo ""

if $SERVER_MODE; then
  review_server
else
  review_vercel
  echo ""
  echo "No servidor:"
  echo "  scp -P 2234 scripts/email/review-email-config.sh root@37.27.17.25:/root/"
  echo "  ssh root@37.27.17.25 -p 2234 'bash /root/review-email-config.sh --server'"
fi
