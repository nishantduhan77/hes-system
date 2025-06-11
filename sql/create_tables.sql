-- Active: 1748431273771@@localhost@5433@hes
-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS eswf_alarms CASCADE;
DROP TABLE IF EXISTS firmware_upgrades CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS billing_profiles CASCADE;
DROP TABLE IF EXISTS daily_load_profiles CASCADE;
DROP TABLE IF EXISTS block_load_profiles CASCADE;
DROP TABLE IF EXISTS instantaneous_profiles CASCADE;
DROP TABLE IF EXISTS event_types CASCADE;
DROP TABLE IF EXISTS meters CASCADE;
DROP TABLE IF EXISTS obis_codes CASCADE;

-- Create OBIS Codes reference table
CREATE TABLE obis_codes (
    id SERIAL PRIMARY KEY,
    obis_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    data_type VARCHAR(50),
    unit VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Meters table (must be created first as other tables reference it)
CREATE TABLE meters (
    meter_serial_number VARCHAR(50) PRIMARY KEY,
    device_id VARCHAR(50),
    manufacturer_name VARCHAR(100),
    firmware_version VARCHAR(50),
    meter_type INTEGER,
    meter_category VARCHAR(50),
    current_rating VARCHAR(50),
    year_of_manufacture INTEGER,
    ctr BIGINT,
    ptr BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Event Types table
CREATE TABLE event_types (
    id SERIAL PRIMARY KEY,
    event_group VARCHAR(50) NOT NULL,
    event_code INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Instantaneous Profile table
CREATE TABLE instantaneous_profiles (
    id SERIAL,
    meter_serial_number VARCHAR(50) NOT NULL,
    capture_time TIMESTAMPTZ NOT NULL,
    rtc_time VARCHAR(12),
    l1_current_ir FLOAT,
    l2_current_iy FLOAT,
    l3_current_ib FLOAT,
    l1_voltage_vrn FLOAT,
    l2_voltage_vyn FLOAT,
    l3_voltage_vbn FLOAT,
    l1_power_factor FLOAT,
    l2_power_factor FLOAT,
    l3_power_factor FLOAT,
    three_phase_pf FLOAT,
    frequency FLOAT,
    apparent_power FLOAT,
    active_power FLOAT,
    reactive_power FLOAT,
    power_failures INTEGER,
    power_off_duration INTEGER,
    tamper_count INTEGER,
    billing_count INTEGER,
    programming_count INTEGER,
    last_billing_date VARCHAR(12),
    cum_energy_wh_import FLOAT,
    cum_energy_wh_export FLOAT,
    cum_energy_varh_q1 FLOAT,
    cum_energy_varh_q2 FLOAT,
    cum_energy_varh_q3 FLOAT,
    cum_energy_varh_q4 FLOAT,
    cum_energy_vah_import FLOAT,
    cum_energy_vah_export FLOAT,
    max_demand_active_import FLOAT,
    max_demand_active_datetime TIMESTAMPTZ,
    max_demand_apparent_import FLOAT,
    max_demand_apparent_datetime TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, capture_time),
    FOREIGN KEY (meter_serial_number) REFERENCES meters(meter_serial_number) ON DELETE CASCADE
);

-- Create Block Load Profile table
CREATE TABLE block_load_profiles (
    id SERIAL,
    meter_serial_number VARCHAR(50) NOT NULL,
    capture_time TIMESTAMPTZ NOT NULL,
    current_ir FLOAT,
    current_iy FLOAT,
    current_ib FLOAT,
    voltage_vrn FLOAT,
    voltage_vyn FLOAT,
    voltage_vbn FLOAT,
    block_energy_wh_import FLOAT,
    block_energy_wh_export FLOAT,
    block_energy_varh_q1 FLOAT,
    block_energy_varh_q2 FLOAT,
    block_energy_varh_q3 FLOAT,
    block_energy_varh_q4 FLOAT,
    block_energy_vah_import FLOAT,
    block_energy_vah_export FLOAT,
    meter_health_indicator INTEGER,
    signal_strength SMALLINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, capture_time),
    FOREIGN KEY (meter_serial_number) REFERENCES meters(meter_serial_number) ON DELETE CASCADE
);

-- Create Daily Load Profile table
CREATE TABLE daily_load_profiles (
    id SERIAL,
    meter_serial_number VARCHAR(50) NOT NULL,
    capture_time TIMESTAMPTZ NOT NULL,
    cum_energy_wh_import FLOAT,
    cum_energy_wh_export FLOAT,
    cum_energy_vah_import FLOAT,
    cum_energy_vah_export FLOAT,
    cum_energy_varh_q1 FLOAT,
    cum_energy_varh_q2 FLOAT,
    cum_energy_varh_q3 FLOAT,
    cum_energy_varh_q4 FLOAT,
    max_demand_w FLOAT,
    max_demand_w_datetime TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, capture_time),
    FOREIGN KEY (meter_serial_number) REFERENCES meters(meter_serial_number) ON DELETE CASCADE
);

-- Create Billing Profile table
CREATE TABLE billing_profiles (
    id SERIAL,
    meter_serial_number VARCHAR(50) NOT NULL,
    billing_date TIMESTAMPTZ NOT NULL,
    system_pf_billing_period FLOAT,
    cum_energy_wh_import FLOAT,
    cum_energy_wh_import_tz1 FLOAT,
    cum_energy_wh_import_tz2 FLOAT,
    cum_energy_wh_import_tz3 FLOAT,
    cum_energy_wh_import_tz4 FLOAT,
    cum_energy_wh_import_tz5 FLOAT,
    cum_energy_wh_import_tz6 FLOAT,
    cum_energy_wh_import_tz7 FLOAT,
    cum_energy_wh_import_tz8 FLOAT,
    cum_energy_vah_import FLOAT,
    cum_energy_vah_import_tz1 FLOAT,
    cum_energy_vah_import_tz2 FLOAT,
    cum_energy_vah_import_tz3 FLOAT,
    cum_energy_vah_import_tz4 FLOAT,
    cum_energy_vah_import_tz5 FLOAT,
    cum_energy_vah_import_tz6 FLOAT,
    cum_energy_vah_import_tz7 FLOAT,
    cum_energy_vah_import_tz8 FLOAT,
    md_w_import FLOAT,
    md_w_datetime TIMESTAMPTZ,
    md_w_tz1 FLOAT,
    md_w_tz1_datetime TIMESTAMPTZ,
    md_w_tz2 FLOAT,
    md_w_tz2_datetime TIMESTAMPTZ,
    md_w_tz3 FLOAT,
    md_w_tz3_datetime TIMESTAMPTZ,
    md_w_tz4 FLOAT,
    md_w_tz4_datetime TIMESTAMPTZ,
    md_w_tz5 FLOAT,
    md_w_tz5_datetime TIMESTAMPTZ,
    md_w_tz6 FLOAT,
    md_w_tz6_datetime TIMESTAMPTZ,
    md_w_tz7 FLOAT,
    md_w_tz7_datetime TIMESTAMPTZ,
    md_w_tz8 FLOAT,
    md_w_tz8_datetime TIMESTAMPTZ,
    md_va_import FLOAT,
    md_va_datetime TIMESTAMPTZ,
    billing_power_on_duration INTEGER,
    cum_energy_wh_export FLOAT,
    cum_energy_vah_export FLOAT,
    cum_energy_varh_q1 FLOAT,
    cum_energy_varh_q2 FLOAT,
    cum_energy_varh_q3 FLOAT,
    cum_energy_varh_q4 FLOAT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, billing_date),
    FOREIGN KEY (meter_serial_number) REFERENCES meters(meter_serial_number) ON DELETE CASCADE
);

-- Create Events table
CREATE TABLE events (
    id SERIAL,
    meter_serial_number VARCHAR(50) NOT NULL,
    event_type_id INTEGER NOT NULL,
    event_datetime TIMESTAMPTZ NOT NULL,
    event_code INTEGER NOT NULL,
    current_ir FLOAT,
    current_iy FLOAT,
    current_ib FLOAT,
    voltage_vrn FLOAT,
    voltage_vyn FLOAT,
    voltage_vbn FLOAT,
    power_factor FLOAT,
    cum_energy_wh_import FLOAT,
    cum_energy_vah_import FLOAT,
    sequence_number BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, event_datetime),
    FOREIGN KEY (meter_serial_number) REFERENCES meters(meter_serial_number) ON DELETE CASCADE,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id)
);

-- Create Firmware Upgrades table
CREATE TABLE firmware_upgrades (
    id SERIAL PRIMARY KEY,
    meter_serial_number VARCHAR(50) NOT NULL,
    block_size BIGINT,
    image_first_not_transferred BOOLEAN,
    image_transfer_enabled BOOLEAN,
    image_transfer_status INTEGER,
    image_activation_info TEXT,
    transfer_initiate_time TIMESTAMPTZ,
    transfer_complete_time TIMESTAMPTZ,
    verification_time TIMESTAMPTZ,
    activation_time TIMESTAMPTZ,
    future_activation_time TIMESTAMPTZ,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meter_serial_number) REFERENCES meters(meter_serial_number) ON DELETE CASCADE
);

-- Create ESWF Alarms table
CREATE TABLE eswf_alarms (
    id SERIAL,
    meter_serial_number VARCHAR(50) NOT NULL,
    alarm_datetime TIMESTAMPTZ NOT NULL,
    r_phase_voltage_missing BOOLEAN DEFAULT FALSE,
    y_phase_voltage_missing BOOLEAN DEFAULT FALSE,
    b_phase_voltage_missing BOOLEAN DEFAULT FALSE,
    over_voltage BOOLEAN DEFAULT FALSE,
    low_voltage BOOLEAN DEFAULT FALSE,
    voltage_unbalance BOOLEAN DEFAULT FALSE,
    ct_reverse BOOLEAN DEFAULT FALSE,
    ct_open BOOLEAN DEFAULT FALSE,
    current_unbalance BOOLEAN DEFAULT FALSE,
    over_current BOOLEAN DEFAULT FALSE,
    power_factor BOOLEAN DEFAULT FALSE,
    last_gasp BOOLEAN DEFAULT FALSE,
    first_breath BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, alarm_datetime),
    FOREIGN KEY (meter_serial_number) REFERENCES meters(meter_serial_number) ON DELETE CASCADE
);

-- Create TimescaleDB hypertables
SELECT create_hypertable('instantaneous_profiles', 'capture_time', if_not_exists => TRUE);
SELECT create_hypertable('block_load_profiles', 'capture_time', if_not_exists => TRUE);
SELECT create_hypertable('daily_load_profiles', 'capture_time', if_not_exists => TRUE);
SELECT create_hypertable('billing_profiles', 'billing_date', if_not_exists => TRUE);
SELECT create_hypertable('events', 'event_datetime', if_not_exists => TRUE);
SELECT create_hypertable('eswf_alarms', 'alarm_datetime', if_not_exists => TRUE);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_instantaneous_profiles_meter_time ON instantaneous_profiles (meter_serial_number, capture_time DESC);
CREATE INDEX IF NOT EXISTS idx_block_load_profiles_meter_time ON block_load_profiles (meter_serial_number, capture_time DESC);
CREATE INDEX IF NOT EXISTS idx_daily_load_profiles_meter_time ON daily_load_profiles (meter_serial_number, capture_time DESC);
CREATE INDEX IF NOT EXISTS idx_billing_profiles_meter_date ON billing_profiles (meter_serial_number, billing_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_meter_datetime ON events (meter_serial_number, event_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_eswf_alarms_meter_datetime ON eswf_alarms (meter_serial_number, alarm_datetime DESC); 