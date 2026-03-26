#!/bin/bash
# Automated daily backup for quote-plus PostgreSQL database
# Crontab: 0 20 * * * /home/backups/quote-plus/backup-quote-plus.sh

BACKUP_DIR="/home/backups/quote-plus"
LOG_FILE="$BACKUP_DIR/backup.log"
RETENTION_DAYS=15
DATE=$(date +%Y-%m-%d)
FILENAME="quote-plus_${DATE}.sql.gz"
CONTAINER_NAME="db-database-1"
DB_USER="melcom-admin-db"
DB_NAME="quote-plus"

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Starting backup..."

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

if [ ${PIPESTATUS[0]} -eq 0 ] && [ -s "$BACKUP_DIR/$FILENAME" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
    log "OK - $FILENAME ($SIZE)"
else
    log "FAIL - backup failed or file is empty"
    rm -f "$BACKUP_DIR/$FILENAME"
    exit 1
fi

DELETED=$(find "$BACKUP_DIR" -name "quote-plus_*.sql.gz" -mtime +$RETENTION_DAYS -print -delete)
if [ -n "$DELETED" ]; then
    log "Cleaned up old backups: $DELETED"
fi

log "Backup complete."
