#!/bin/bash

# Start PostgreSQL and TimescaleDB containers if not running
docker-compose up -d hes_postgres timescaledb

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
sleep 10

# Create tables and insert test data
echo "Creating tables and inserting test data..."
PGPASSWORD=hes_password psql -h localhost -p 5432 -U hes_user -d hes_db -f sql/create_tables.sql
PGPASSWORD=hes_password psql -h localhost -p 5432 -U hes_user -d hes_db -f sql/insert_test_meters.sql

# Start the collector service
echo "Starting collector service..."
cd apps/collector
./mvnw spring-boot:run 