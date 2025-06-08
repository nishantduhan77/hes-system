-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create meters table
CREATE TABLE IF NOT EXISTS meters (
    meter_id VARCHAR(50) PRIMARY KEY,
    installation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    meter_type VARCHAR(50),
    firmware_version VARCHAR(50)
);

-- Create readings table
CREATE TABLE IF NOT EXISTS meter_readings (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    meter_id VARCHAR(50) REFERENCES meters(meter_id),
    obis_code VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(20),
    quality_code INTEGER
);

-- Convert readings table to hypertable
SELECT create_hypertable('meter_readings', 'time');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_readings_meter_time 
ON meter_readings (meter_id, time DESC);

-- Create events table
CREATE TABLE IF NOT EXISTS meter_events (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    meter_id VARCHAR(50) REFERENCES meters(meter_id),
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    severity INTEGER
);

-- Convert events table to hypertable
SELECT create_hypertable('meter_events', 'time');

-- Create index for events
CREATE INDEX IF NOT EXISTS idx_events_meter_time 
ON meter_events (meter_id, time DESC);

-- Create continuous aggregates for daily statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_energy_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    meter_id,
    obis_code,
    AVG(value) as avg_value,
    MAX(value) as max_value,
    MIN(value) as min_value
FROM meter_readings
WHERE obis_code LIKE '1.0.1.8.%' -- Energy readings
GROUP BY bucket, meter_id, obis_code;

-- Add retention policy (90 days for raw data)
SELECT add_retention_policy('meter_readings', INTERVAL '90 days');

-- Keep aggregated data for 2 years
SELECT add_retention_policy('daily_energy_stats', INTERVAL '2 years'); 