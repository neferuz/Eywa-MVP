#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/backup_db.sh [output_file]
# Requires: pg_dump in PATH, env var DATABASE_URL

OUTPUT_FILE="${1:-backup.dump}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Example: postgresql://user:pass@host:5432/dbname" >&2
  exit 1
fi

echo "Creating backup to ${OUTPUT_FILE}..."
pg_dump -Fc -f "${OUTPUT_FILE}" "${DATABASE_URL}"
echo "Backup completed: ${OUTPUT_FILE}"

