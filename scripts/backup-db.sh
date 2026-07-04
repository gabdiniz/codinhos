#!/bin/sh
# ── Backup do Postgres (pg_dump) com retenção ───────────────────────────────
# Roda dentro do container `backup` (imagem postgres:16) via cron.
# Gera um dump comprimido por execução em /backups e apaga os mais antigos que
# BACKUP_RETENTION_DAYS.
#
# Variáveis esperadas no ambiente:
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST (default: db)
#   BACKUP_RETENTION_DAYS (default: 14)
set -eu

HOST="${POSTGRES_HOST:-db}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="/backups/codinhos-${STAMP}.sql.gz"

export PGPASSWORD="$POSTGRES_PASSWORD"

echo "[backup] $(date -Is) → ${OUT}"
pg_dump -h "$HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges \
  | gzip -9 > "$OUT"

# Retenção: apaga dumps mais antigos que N dias.
find /backups -name 'codinhos-*.sql.gz' -type f -mtime "+${RETENTION}" -delete

echo "[backup] ok. Dumps atuais:"
ls -1t /backups/codinhos-*.sql.gz 2>/dev/null | head -5
