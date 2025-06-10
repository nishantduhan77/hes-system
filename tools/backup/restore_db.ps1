# Configuration
$DB_NAME = "hes"
$DB_USER = "hes_user"

# Check if backup file is provided
if (-not $args[0]) {
    Write-Host "Error: Please provide the backup file path"
    Write-Host "Usage: .\restore_db.ps1 <backup_file_path>"
    exit 1
}

$BACKUP_FILE = $args[0]

# Check if backup file exists
if (-not (Test-Path $BACKUP_FILE)) {
    Write-Host "Error: Backup file not found: $BACKUP_FILE"
    exit 1
}

# Restore database
Write-Host "Restoring $DB_NAME database from $BACKUP_FILE..."
$env:PGPASSWORD = "hes_password"
& pg_restore -h localhost -p 5432 -U $DB_USER -d $DB_NAME -c -v $BACKUP_FILE

Write-Host "Restore completed" 