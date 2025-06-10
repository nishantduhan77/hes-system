-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS meter_readings CASCADE;
DROP TABLE IF EXISTS meters CASCADE;
DROP TABLE IF EXISTS meter_groups CASCADE;

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
    meter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_code VARCHAR(100) NOT NULL UNIQUE,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    meter_type VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    firmware_version VARCHAR(50),
    installation_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    last_communication TIMESTAMPTZ,
    protocol_version VARCHAR(50),
    ip_address VARCHAR(50),
    port INTEGER,
    group_id UUID REFERENCES meter_groups(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for meters
CREATE INDEX idx_meters_group_id ON meters(group_id);
CREATE INDEX idx_meters_status ON meters(status);
CREATE INDEX idx_meters_last_communication ON meters(last_communication);

-- Meter readings table (TimescaleDB hypertable)
CREATE TABLE meter_readings (
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    hes_timestamp TIMESTAMPTZ NOT NULL,
    rtc_timestamp TIMESTAMPTZ,
    reading_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    original_value DOUBLE PRECISION,
    scaling_factor INTEGER,
    quality INTEGER NOT NULL DEFAULT 192,
    unit VARCHAR(20) NOT NULL,
    source VARCHAR(20) DEFAULT 'NORMAL_READ',
    capture_period INTEGER,
    validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    validation_flags INTEGER[],
    communication_status VARCHAR(20),
    retry_count INTEGER DEFAULT 0,
    meter_program_id VARCHAR(50),
    channel_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meter_id, hes_timestamp, reading_type)
);

-- Convert to hypertable
SELECT create_hypertable(
    'meter_readings',
    'hes_timestamp',
    chunk_time_interval => INTERVAL '1 day',
    partitioning_column => 'meter_id',
    number_partitions => 4,
    if_not_exists => TRUE
);

-- Create indexes for meter readings
CREATE INDEX idx_readings_meter_timestamp ON meter_readings(meter_id, hes_timestamp DESC);
CREATE INDEX idx_readings_type_timestamp ON meter_readings(reading_type, hes_timestamp DESC);
CREATE INDEX idx_readings_rtc_timestamp ON meter_readings(rtc_timestamp DESC);

-- Add compression policy
ALTER TABLE meter_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'meter_id,reading_type'
);

SELECT add_compression_policy('meter_readings', INTERVAL '7 days');

-- Add retention policy
SELECT add_retention_policy('meter_readings', INTERVAL '3 months', if_not_exists => true);

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