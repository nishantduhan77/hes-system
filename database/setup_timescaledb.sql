-- We're already connected to hes_db
-- CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Recreate the tables with proper TimescaleDB configuration
DROP TABLE IF EXISTS meter_readings CASCADE;
DROP TABLE IF EXISTS power_readings CASCADE;
DROP TABLE IF EXISTS energy_measurements CASCADE;
DROP TABLE IF EXISTS voltage_measurements CASCADE;
DROP TABLE IF EXISTS current_measurements CASCADE;
DROP TABLE IF EXISTS daily_load_profile CASCADE;
DROP TABLE IF EXISTS block_load_profile CASCADE;
DROP TABLE IF EXISTS billing_profile CASCADE;
DROP TABLE IF EXISTS instant_profile CASCADE;

-- Create meter_readings table
CREATE TABLE meter_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    quality INTEGER NOT NULL DEFAULT 192,
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meter_id, timestamp, reading_type)
);

-- Create power_readings table
CREATE TABLE power_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    active_power_import FLOAT,
    active_power_export FLOAT,
    reactive_power_import FLOAT,
    reactive_power_export FLOAT,
    apparent_power FLOAT,
    power_factor FLOAT,
    frequency FLOAT,
    PRIMARY KEY (meter_id, timestamp)
);

-- Create energy_measurements table
CREATE TABLE energy_measurements (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    active_energy_import FLOAT,
    active_energy_export FLOAT,
    reactive_energy_import FLOAT,
    reactive_energy_export FLOAT,
    PRIMARY KEY (meter_id, timestamp)
);

-- Create voltage_measurements table
CREATE TABLE voltage_measurements (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    voltage_l1 FLOAT,
    voltage_l2 FLOAT,
    voltage_l3 FLOAT,
    voltage_thd FLOAT,
    PRIMARY KEY (meter_id, timestamp)
);

-- Create current_measurements table
CREATE TABLE current_measurements (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    current_l1 FLOAT,
    current_l2 FLOAT,
    current_l3 FLOAT,
    current_n FLOAT,
    current_thd FLOAT,
    PRIMARY KEY (meter_id, timestamp)
);

-- Create daily_load_profile table
CREATE TABLE daily_load_profile (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    interval_minutes INTEGER NOT NULL,
    active_energy_import FLOAT,
    active_energy_export FLOAT,
    reactive_energy_import FLOAT,
    reactive_energy_export FLOAT,
    PRIMARY KEY (meter_id, timestamp)
);

-- Create block_load_profile table
CREATE TABLE block_load_profile (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    block_interval INTEGER NOT NULL,
    active_energy_import FLOAT,
    active_energy_export FLOAT,
    reactive_energy_import FLOAT,
    reactive_energy_export FLOAT,
    PRIMARY KEY (meter_id, timestamp)
);

-- Create billing_profile table
CREATE TABLE billing_profile (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    billing_period VARCHAR(20),
    active_energy_import FLOAT,
    active_energy_export FLOAT,
    reactive_energy_import FLOAT,
    reactive_energy_export FLOAT,
    maximum_demand FLOAT,
    PRIMARY KEY (meter_id, timestamp)
);

-- Create instant_profile table
CREATE TABLE instant_profile (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    active_power FLOAT,
    reactive_power FLOAT,
    voltage FLOAT,
    current FLOAT,
    power_factor FLOAT,
    frequency FLOAT,
    PRIMARY KEY (meter_id, timestamp)
);

-- Convert tables to hypertables
SELECT create_hypertable('meter_readings', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT create_hypertable('power_readings', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT create_hypertable('energy_measurements', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT create_hypertable('voltage_measurements', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT create_hypertable('current_measurements', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT create_hypertable('daily_load_profile', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT create_hypertable('block_load_profile', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT create_hypertable('billing_profile', 'timestamp', 
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

SELECT create_hypertable('instant_profile', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter ON meter_readings(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_power_readings_meter ON power_readings(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_energy_measurements_meter ON energy_measurements(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_voltage_measurements_meter ON voltage_measurements(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_current_measurements_meter ON current_measurements(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_daily_load_meter ON daily_load_profile(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_block_load_meter ON block_load_profile(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_billing_meter ON billing_profile(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_instant_meter ON instant_profile(meter_id, timestamp DESC); 