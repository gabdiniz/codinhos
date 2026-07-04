#!/bin/sh
# Entrypoint do container `backup`: instala um cron diário e faz um backup
# imediato no primeiro boot (para validar credenciais/volume logo de cara).
set -eu

CRON_SCHEDULE="${BACKUP_CRON:-0 3 * * *}"   # default: todo dia 03:00 (UTC do container)

echo "[backup] agendando: ${CRON_SCHEDULE}"

# O busybox crond não repassa o ambiente do container aos jobs. Exportamos só o
# que o script precisa, com aspas (valores podem conter caracteres especiais).
: > /etc/backup.env
for v in POSTGRES_HOST POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB BACKUP_RETENTION_DAYS; do
  eval "val=\${$v:-}"
  # escapa aspas simples no valor
  esc=$(printf '%s' "$val" | sed "s/'/'\\\\''/g")
  echo "export $v='$esc'" >> /etc/backup.env
done

mkdir -p /etc/crontabs
cat > /etc/crontabs/root <<CRON
${CRON_SCHEDULE} . /etc/backup.env; /usr/local/bin/backup-db.sh >> /backups/backup.log 2>&1
CRON

touch /backups/backup.log

# Backup imediato (não bloqueia o boot do cron se falhar).
. /etc/backup.env
/usr/local/bin/backup-db.sh >> /backups/backup.log 2>&1 || echo "[backup] backup inicial falhou (ver /backups/backup.log)"

echo "[backup] cron ativo. Seguindo o log:"
crond -f -l 8 -c /etc/crontabs &
tail -f /backups/backup.log
