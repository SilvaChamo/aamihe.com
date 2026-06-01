#!/usr/bin/env bash
# Backup semanal Supabase AAMIHE (Postgres + .env).
# Instalar no servidor: /root/backup-weekly.sh
# Cron (domingo 03:00): 0 3 * * 0 /root/backup-weekly.sh >> /var/log/supabase-aamihe-backup.log 2>&1
set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase-aamihe/docker}"
BACKUP_ROOT="${BACKUP_ROOT:-/root/backups/supabase-aamihe}"
KEEP_WEEKS="${KEEP_WEEKS:-8}"
STAMP="$(date +%Y-%m-%d_%H%M)"
DEST="${BACKUP_ROOT}/${STAMP}"
LOG_TAG="[supabase-aamihe-backup ${STAMP}]"

log() { echo "${LOG_TAG} $*"; }

die() {
  log "ERRO: $*"
  exit 1
}

if [[ ! -d "${COMPOSE_DIR}" ]]; then
  die "Pasta Docker não encontrada: ${COMPOSE_DIR}"
fi

mkdir -p "${DEST}"

# Verificar contentores
cd "${COMPOSE_DIR}"
if ! docker compose ps --status running 2>/dev/null | grep -q supabase-db; then
  die "Contentor supabase-db não está a correr. Corra: cd ${COMPOSE_DIR} && docker compose up -d"
fi

log "Início do backup em ${DEST}"

# Dump Postgres (formato custom, compressão interna)
docker compose exec -T db pg_dump -U postgres -Fc postgres > "${DEST}/postgres.dump" \
  || die "pg_dump falhou"

# Cópia do .env (keys — manter seguro)
if [[ -f .env ]]; then
  cp -a .env "${DEST}/docker.env"
fi

# Estado dos contentores (sem secrets)
docker compose ps > "${DEST}/docker-ps.txt" 2>&1 || true

# Uso de disco do volume Docker (referência)
du -sh "${COMPOSE_DIR}/volumes" 2>/dev/null > "${DEST}/volumes-size.txt" || true

# Arquivo final
tar -czf "${BACKUP_ROOT}/supabase-aamihe_${STAMP}.tar.gz" -C "${BACKUP_ROOT}" "${STAMP}"
rm -rf "${DEST}"

log "Arquivo: ${BACKUP_ROOT}/supabase-aamihe_${STAMP}.tar.gz ($(du -h "${BACKUP_ROOT}/supabase-aamihe_${STAMP}.tar.gz" | cut -f1))"

# Apagar backups antigos (manter KEEP_WEEKS ficheiros .tar.gz)
mapfile -t OLD < <(ls -1t "${BACKUP_ROOT}"/supabase-aamihe_*.tar.gz 2>/dev/null || true)
if ((${#OLD[@]} > KEEP_WEEKS)); then
  for ((i = KEEP_WEEKS; i < ${#OLD[@]}; i++)); do
    log "Remover antigo: ${OLD[$i]}"
    rm -f "${OLD[$i]}"
  done
fi

# Alerta se disco raiz > 85%
USED_PCT="$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')"
if [[ "${USED_PCT}" -ge 85 ]]; then
  log "AVISO: disco / a ${USED_PCT}% — considere limpar backups ou aumentar disco"
fi

log "Concluído OK"
