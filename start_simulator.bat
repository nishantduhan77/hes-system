@echo off

echo Please ensure you have the following tools installed:
echo 1. PostgreSQL client tools (psql) - Download from https://www.postgresql.org/download/windows/
echo 2. Maven - Download from https://maven.apache.org/download.cgi
echo.
echo Press any key to continue if you have these tools installed, or Ctrl+C to exit and install them first.
pause

REM Start PostgreSQL and TimescaleDB containers if not running
docker-compose up -d timescaledb

REM Wait for databases to be ready
echo Waiting for databases to be ready...
timeout /t 10

REM Create tables and insert test data
echo Creating tables and inserting test data...
set PGPASSWORD=hes_password
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -p 5433 -U hes_user -d hes_db -f sql/create_tables.sql
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -p 5433 -U hes_user -d hes_db -f sql/insert_test_meters.sql

REM Start the collector service
echo Starting collector service...
cd apps/collector

REM Install Maven wrapper if not present
if not exist "mvnw.cmd" (
    echo Installing Maven wrapper...
    mvn -N wrapper:wrapper
)

REM Start the application
call mvnw.cmd spring-boot:run 