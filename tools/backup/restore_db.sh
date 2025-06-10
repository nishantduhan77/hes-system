#!/bin/bash

# Configuration
DB_NAME="hes_db"
DB_USER="hes_user"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Error: Please provide the backup file path"
    echo "Usage: $0 <backup_file_path>"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Restore database
echo "Restoring $DB_NAME database from $BACKUP_FILE..."
PGPASSWORD=hes_password pg_restore -h localhost -p 5433 -U $DB_USER -d $DB_NAME -c -v "$BACKUP_FILE"

echo "Restore completed" 