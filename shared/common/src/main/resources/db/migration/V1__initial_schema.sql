-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Meter Groups table
CREATE TABLE meter_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_meter_groups_name UNIQUE (name)
);

-- Meters table
-- Meters table already exists, so we'll add any missing columns
ALTER TABLE meters
ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS protocol_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS port INTEGER,
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES meter_groups(id),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS meter_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS installation_date DATE,
ADD COLUMN IF NOT EXISTS location_coordinates POINT,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS communication_protocol VARCHAR(50),
ADD COLUMN IF NOT EXISTS meter_program_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS meter_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_reading_timestamp TIMESTAMPTZ;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_meters_serial_number') THEN
        ALTER TABLE meters ADD CONSTRAINT uk_meters_serial_number UNIQUE (serial_number);
    END IF;
END $$;

-- Create indexes for common queries
CREATE INDEX idx_meters_group_id ON meters(group_id);
CREATE INDEX idx_meters_status ON meters(status);
CREATE INDEX idx_meters_last_connected_at ON meters(last_connected_at);

-- Meter readings table (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS meter_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    quality INTEGER NOT NULL DEFAULT 192, -- Default to GOOD quality
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meter_id, timestamp, reading_type)
);

-- Add foreign key constraint if meters table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meters') AND
       NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_meter_readings_meter_id') THEN
        ALTER TABLE meter_readings
        ADD CONSTRAINT fk_meter_readings_meter_id
        FOREIGN KEY (meter_id) REFERENCES meters(meter_id);
    END IF;
END $$;

-- Convert to hypertable


SELECT create_hypertable(
    'meter_readings',
    'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE,
    migrate_data => TRUE
);

-- Drop primary key constraint and recreate with timestamp included
ALTER TABLE meter_readings DROP CONSTRAINT meter_readings_pkey;
ALTER TABLE meter_readings ADD PRIMARY KEY (meter_id, timestamp, reading_type);

-- Create indexes for meter readings
CREATE INDEX idx_readings_meter_timestamp ON meter_readings(meter_id, timestamp DESC);
CREATE INDEX idx_readings_type_timestamp ON meter_readings(reading_type, timestamp DESC);

-- Meter events table (for status changes, alarms, etc.)
CREATE TABLE meter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for events
CREATE INDEX idx_events_meter_timestamp ON meter_events(meter_id, timestamp DESC);
CREATE INDEX idx_events_type_severity ON meter_events(event_type, severity);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
);

-- Create continuous aggregates for common queries
CREATE MATERIALIZED VIEW meter_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    meter_id,
    time_bucket('1 hour', timestamp) AS bucket,
    reading_type,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as reading_count
FROM meter_readings
GROUP BY meter_id, time_bucket('1 hour', timestamp), reading_type;

-- Add retention policy (keep raw data for 3 months)
SELECT add_retention_policy(
    'meter_readings',
    INTERVAL '3 months',
    if_not_exists => true
);

-- Add compression policy (compress chunks older than 7 days)
ALTER TABLE meter_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'meter_id,reading_type'
);

SELECT add_compression_policy('meter_readings', INTERVAL '7 days');

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_meters_updated_at
    BEFORE UPDATE ON meters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meter_groups_updated_at
    BEFORE UPDATE ON meter_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at(); 