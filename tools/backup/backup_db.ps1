# Configuration
$DB_NAME = "hes"
$DB_USER = "hes_user"
$BACKUP_DIR = ".\backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR
}

# Create backup
Write-Host "Creating backup of $DB_NAME database..."
$env:PGPASSWORD = "hes_password"
& pg_dump -h localhost -p 5432 -U $DB_USER -F c -b -v -f "$BACKUP_DIR\${DB_NAME}_${DATE}.backup" $DB_NAME

# Keep only last 5 backups
Write-Host "Cleaning old backups..."
Get-ChildItem "$BACKUP_DIR\*.backup" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5 | Remove-Item

Write-Host "Backup completed: $BACKUP_DIR\${DB_NAME}_${DATE}.backup" 