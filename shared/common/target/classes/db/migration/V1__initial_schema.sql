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
CREATE TABLE meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    firmware_version VARCHAR(50),
    protocol_version VARCHAR(50),
    ip_address INET,
    port INTEGER,
    group_id UUID REFERENCES meter_groups(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    last_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_meters_serial_number UNIQUE (serial_number)
);

-- Create indexes for common queries
CREATE INDEX idx_meters_group_id ON meters(group_id);
CREATE INDEX idx_meters_status ON meters(status);
CREATE INDEX idx_meters_last_connected_at ON meters(last_connected_at);

-- Meter readings table (TimescaleDB hypertable)
CREATE TABLE meter_readings (
    meter_id UUID NOT NULL REFERENCES meters(id),
    timestamp TIMESTAMPTZ NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    quality INTEGER NOT NULL DEFAULT 192, -- Default to GOOD quality
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meter_id, timestamp, reading_type)
);

-- Convert to hypertable
SELECT create_hypertable(
    'meter_readings',
    'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    partitioning_column => 'meter_id',
    number_partitions => 4
);

-- Create indexes for meter readings
CREATE INDEX idx_readings_meter_timestamp ON meter_readings(meter_id, timestamp DESC);
CREATE INDEX idx_readings_type_timestamp ON meter_readings(reading_type, timestamp DESC);

-- Meter events table (for status changes, alarms, etc.)
CREATE TABLE meter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(id),
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