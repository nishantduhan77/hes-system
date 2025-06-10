#!/bin/bash

# Configuration
DB_NAME="hes_db"
DB_USER="hes_user"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup of $DB_NAME database..."
PGPASSWORD=hes_password pg_dump -h localhost -p 5433 -U $DB_USER -F c -b -v -f "$BACKUP_DIR/${DB_NAME}_${DATE}.backup" $DB_NAME

# Keep only last 5 backups
echo "Cleaning old backups..."
ls -t "$BACKUP_DIR"/*.backup | tail -n +6 | xargs -r rm

echo "Backup completed: $BACKUP_DIR/${DB_NAME}_${DATE}.backup" 