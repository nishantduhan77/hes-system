# HES Database Setup

This directory contains SQL scripts for setting up the Head End System (HES) database.

## Database Configuration
- Database Name: `hes`
- Port: 5433
- User: `hes_user`
- Password: `hes_password`

## Setup Instructions

1. First, run the database setup script:
```bash
psql -U postgres -p 5433 -f setup_database.sql
```

2. Then, run the table creation script:
```bash
psql -U hes_user -d hes -p 5433 -f create_tables.sql
```

## Database Structure

The database includes the following main components:

1. Base Tables:
   - `meters`: Meter information
   - `obis_codes`: OBIS code reference

2. Profile Tables:
   - `instantaneous_profiles`: Real-time measurements
   - `block_load_profiles`: Interval data
   - `daily_load_profiles`: Daily aggregations
   - `billing_profiles`: Monthly billing data

3. Event and Alarm Tables:
   - `event_types`: Event reference
   - `events`: Event logs
   - `eswf_alarms`: ESWF bit alarms
   - `firmware_upgrades`: Firmware upgrade tracking

All time-series tables are implemented as TimescaleDB hypertables for efficient time-based queries and data management.

## Notes
- The database uses TimescaleDB extension for time-series data management
- All timestamps are stored in UTC (TIMESTAMPTZ)
- Foreign key constraints ensure data integrity
- Indexes are created for frequently queried fields 