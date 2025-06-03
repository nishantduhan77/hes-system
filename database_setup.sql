-- Create the database
CREATE DATABASE hes_system;

-- Connect to the new database
\c hes_system

-- Enable TimescaleDB extension if you have it installed
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create meters table
CREATE TABLE meters (
    meter_id UUID PRIMARY KEY,
    serial_number VARCHAR(50) UNIQUE,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    installation_date TIMESTAMPTZ,
    firmware_version VARCHAR(50),
    status VARCHAR(20),
    last_communication TIMESTAMPTZ
);

-- Create power_readings table
CREATE TABLE power_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    active_power_import DOUBLE PRECISION,
    active_power_export DOUBLE PRECISION,
    voltage_r_phase DOUBLE PRECISION,
    current_r_phase DOUBLE PRECISION,
    quality_code INTEGER,
    PRIMARY KEY (meter_id, timestamp),
    FOREIGN KEY (meter_id) REFERENCES meters(meter_id)
);

-- Create hypertable for power_readings
SELECT create_hypertable(
    'power_readings',
    'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create meter_daily_summary view
CREATE OR REPLACE VIEW meter_daily_summary AS
SELECT 
    m.serial_number,
    COUNT(pr.*) as reading_count,
    AVG(pr.active_power_import) as avg_import,
    MAX(pr.active_power_import) as max_import,
    AVG(pr.voltage_r_phase) as avg_voltage,
    MIN(pr.voltage_r_phase) as min_voltage,
    MAX(pr.voltage_r_phase) as max_voltage
FROM meters m
LEFT JOIN power_readings pr 
    ON m.meter_id = pr.meter_id
    AND pr.timestamp >= date_trunc('day', NOW())
GROUP BY m.meter_id, m.serial_number;

-- Create meter_health_status view
CREATE OR REPLACE VIEW meter_health_status AS
SELECT 
    m.serial_number,
    m.status,
    m.last_communication,
    CASE 
        WHEN m.last_communication < NOW() - INTERVAL '24 hours' THEN 'Critical'
        WHEN m.last_communication < NOW() - INTERVAL '6 hours' THEN 'Warning'
        ELSE 'Good'
    END as communication_status,
    COUNT(pr.*) FILTER (WHERE pr.timestamp >= NOW() - INTERVAL '24 hours') as readings_last_24h,
    COUNT(pr.*) FILTER (WHERE pr.quality_code != 0) as error_readings_24h
FROM meters m
LEFT JOIN power_readings pr 
    ON m.meter_id = pr.meter_id
    AND pr.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY m.meter_id, m.serial_number, m.status, m.last_communication;

-- Add indexes for better query performance
CREATE INDEX idx_power_readings_meter_timestamp ON power_readings(meter_id, timestamp DESC);
CREATE INDEX idx_meters_serial ON meters(serial_number);
CREATE INDEX idx_meters_status ON meters(status); 