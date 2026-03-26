# Automatic Database Backup — Design Spec

**Date**: 2026-03-26
**Status**: Approved

## Overview

Automated nightly backup of the `quote-plus` PostgreSQL database via `pg_dump` on the DB server, with 15-day retention and automatic cleanup.

## Requirements

- Full database dump (schema + data) of `quote-plus`
- Runs daily at 20:00 server time
- Compressed with gzip to save disk space
- Retains the last 15 days of backups, deletes older ones automatically
- Stored locally on the DB server at `/home/backups/quote-plus/`
- Logging of success/failure for each run

## Technical Design

### Backup Script

**File**: `db/backup-quote-plus.sh`
**Location on server**: To be deployed to the DB server and registered in crontab.

**Logic**:
1. Create backup directory if it doesn't exist
2. Run `pg_dump` for database `quote-plus` piped through `gzip`
3. Output file: `quote-plus_YYYY-MM-DD.sql.gz`
4. Delete files older than 15 days using `find -mtime +15 -delete`
5. Log outcome (timestamp, file size, success/failure)

**Log file**: `/home/backups/quote-plus/backup.log`

### Crontab Entry

```cron
0 20 * * * /home/backups/quote-plus/backup-quote-plus.sh
```

### File Naming Convention

```
quote-plus_2026-03-26.sql.gz
quote-plus_2026-03-25.sql.gz
...
```

### Restore Procedure

```bash
# Full restore
gunzip < /home/backups/quote-plus/quote-plus_2026-03-26.sql.gz | psql -U melcom-admin-db -d quote-plus

# Or to inspect first
gunzip -k quote-plus_2026-03-26.sql.gz  # decompress keeping original
less quote-plus_2026-03-26.sql           # inspect
```

### Connection Details

- **Host**: localhost (script runs on the DB server itself)
- **Port**: 15432 (as per Docker Compose config)
- **User**: `melcom-admin-db`
- **Database**: `quote-plus`
- **Auth**: Password via `.pgpass` file or `PGPASSWORD` env var in script

## Implementation Steps

1. Create `db/backup-quote-plus.sh` script in the repository
2. SSH into the DB server
3. Deploy the script to `/home/backups/quote-plus/`
4. Create `.pgpass` or configure password in the script
5. Make script executable (`chmod +x`)
6. Add crontab entry
7. Test with a manual run
8. Verify backup file is created and valid
