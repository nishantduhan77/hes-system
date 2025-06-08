-- Create the database
CREATE DATABASE hes_system;

-- Connect to the new database
\c hes_system

-- Enable TimescaleDB extension if you have it installed
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create meters table
CREATE TABLE IF NOT EXISTS meters (
    meter_id UUID PRIMARY KEY,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    installation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    firmware_version VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    last_communication TIMESTAMP
);

-- Create power_readings table
CREATE TABLE IF NOT EXISTS power_readings (
    reading_id SERIAL PRIMARY KEY,
    meter_id UUID REFERENCES meters(meter_id),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active_power_import FLOAT,
    active_power_export FLOAT,
    voltage_r_phase FLOAT,
    current_r_phase FLOAT,
    quality_code INTEGER DEFAULT 0
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
    m.meter_id,
    m.serial_number,
    m.status,
    m.last_communication,
    CASE 
        WHEN m.status = 'DISCONNECTED' THEN 'Offline'
        WHEN NOW() - m.last_communication > INTERVAL '5 minutes' THEN 'Communication Error'
        ELSE 'Good'
    END as communication_status
FROM meters m;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_power_readings_timestamp ON power_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_power_readings_meter_id ON power_readings(meter_id);
CREATE INDEX idx_meters_serial ON meters(serial_number);
CREATE INDEX idx_meters_status ON meters(status); 