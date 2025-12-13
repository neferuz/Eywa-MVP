#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/restore_db.sh backup.dump
# Requires: pg_restore in PATH, env var DATABASE_URL

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_file.dump>" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Example: postgresql://user:pass@host:5432/dbname" >&2
  exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "Restoring from ${BACKUP_FILE}..."
pg_restore -c -d "${DATABASE_URL}" "${BACKUP_FILE}"
echo "Restore completed"

