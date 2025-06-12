-- OBIS Code Reference Table
CREATE TABLE obis_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logical_name VARCHAR(50) NOT NULL UNIQUE,
    class_id INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_obis_logical_name ON obis_codes(logical_name);
CREATE INDEX idx_obis_class_id ON obis_codes(class_id);

-- Event Log Table
CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    event_code INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    occurrence_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    obis_code VARCHAR(20) NOT NULL,
    additional_info JSONB,
    status VARCHAR(20) DEFAULT 'UNACKNOWLEDGED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_logs_meter ON event_logs(meter_id, occurrence_time DESC);
CREATE INDEX idx_event_logs_type ON event_logs(event_type, occurrence_time DESC);

-- Instantaneous Profile Table
CREATE TABLE instantaneous_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_time TIMESTAMPTZ NOT NULL,
    rtc_time VARCHAR(12),  -- OBIS: 0.0.1.0.0.255
    -- Current measurements
    current_l1 DOUBLE PRECISION,  -- OBIS: 1.0.31.7.0.255
    current_l2 DOUBLE PRECISION,  -- OBIS: 1.0.51.7.0.255
    current_l3 DOUBLE PRECISION,  -- OBIS: 1.0.71.7.0.255
    -- Voltage measurements
    voltage_l1 DOUBLE PRECISION,  -- OBIS: 1.0.32.7.0.255
    voltage_l2 DOUBLE PRECISION,  -- OBIS: 1.0.52.7.0.255
    voltage_l3 DOUBLE PRECISION,  -- OBIS: 1.0.72.7.0.255
    -- Power factor measurements
    power_factor_l1 DOUBLE PRECISION,  -- OBIS: 1.0.33.7.0.255
    power_factor_l2 DOUBLE PRECISION,  -- OBIS: 1.0.53.7.0.255
    power_factor_l3 DOUBLE PRECISION,  -- OBIS: 1.0.73.7.0.255
    total_power_factor DOUBLE PRECISION,  -- OBIS: 1.0.13.7.0.255
    frequency DOUBLE PRECISION,  -- OBIS: 1.0.14.7.0.255
    -- Power measurements
    active_power_import DOUBLE PRECISION,  -- OBIS: 1.0.1.7.0.255
    active_power_export DOUBLE PRECISION,  -- OBIS: 1.0.2.7.0.255
    reactive_power_import DOUBLE PRECISION,  -- OBIS: 1.0.3.7.0.255
    reactive_power_export DOUBLE PRECISION,  -- OBIS: 1.0.4.7.0.255
    apparent_power DOUBLE PRECISION,  -- OBIS: 1.0.9.7.0.255
    -- Energy measurements
    active_energy_import DOUBLE PRECISION,  -- OBIS: 1.0.1.8.0.255
    active_energy_export DOUBLE PRECISION,  -- OBIS: 1.0.2.8.0.255
    reactive_energy_import DOUBLE PRECISION,  -- OBIS: 1.0.3.8.0.255
    reactive_energy_export DOUBLE PRECISION,  -- OBIS: 1.0.4.8.0.255
    apparent_energy_import DOUBLE PRECISION,  -- OBIS: 1.0.9.8.0.255
    apparent_energy_export DOUBLE PRECISION,  -- OBIS: 1.0.10.8.0.255
    -- Status information
    power_quality_events INTEGER,  -- OBIS: 0.0.96.7.0.255
    power_down_count BIGINT,  -- OBIS: 0.0.96.7.1.255
    power_down_duration BIGINT,  -- OBIS: 0.0.96.7.2.255
    tamper_count BIGINT,  -- OBIS: 0.0.96.7.3.255
    meter_status_word VARCHAR(32),  -- OBIS: 0.0.96.5.0.255
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_instantaneous_profiles_meter_time ON instantaneous_profiles(meter_id, capture_time DESC);

-- Block Load Profile Table
CREATE TABLE block_load_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_time TIMESTAMPTZ NOT NULL,
    block_interval INTEGER NOT NULL, -- in minutes
    -- Energy measurements for the block
    block_energy_import DOUBLE PRECISION,  -- OBIS: 1.0.1.29.0.255
    block_energy_export DOUBLE PRECISION,  -- OBIS: 1.0.2.29.0.255
    block_reactive_import DOUBLE PRECISION,  -- OBIS: 1.0.3.29.0.255
    block_reactive_export DOUBLE PRECISION,  -- OBIS: 1.0.4.29.0.255
    block_apparent_import DOUBLE PRECISION,  -- OBIS: 1.0.9.29.0.255
    block_apparent_export DOUBLE PRECISION,  -- OBIS: 1.0.10.29.0.255
    -- Average measurements
    avg_voltage_l1 DOUBLE PRECISION,  -- OBIS: 1.0.32.27.0.255
    avg_voltage_l2 DOUBLE PRECISION,  -- OBIS: 1.0.52.27.0.255
    avg_voltage_l3 DOUBLE PRECISION,  -- OBIS: 1.0.72.27.0.255
    avg_current_l1 DOUBLE PRECISION,  -- OBIS: 1.0.31.27.0.255
    avg_current_l2 DOUBLE PRECISION,  -- OBIS: 1.0.51.27.0.255
    avg_current_l3 DOUBLE PRECISION,  -- OBIS: 1.0.71.27.0.255
    avg_power_factor DOUBLE PRECISION,  -- OBIS: 1.0.13.27.0.255
    avg_frequency DOUBLE PRECISION,  -- OBIS: 1.0.14.27.0.255
    -- Status information
    status_word VARCHAR(32),  -- OBIS: 0.0.96.5.0.255
    validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Convert block_load_profiles to TimescaleDB hypertable
SELECT create_hypertable(
    'block_load_profiles',
    'capture_time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

CREATE INDEX idx_block_load_profiles_meter_time ON block_load_profiles(meter_id, capture_time DESC);

-- Daily Load Profile Table
CREATE TABLE daily_load_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_date DATE NOT NULL,
    -- Daily energy totals
    daily_energy_import DOUBLE PRECISION,  -- OBIS: 1.0.1.8.0.255
    daily_energy_export DOUBLE PRECISION,  -- OBIS: 1.0.2.8.0.255
    daily_reactive_import DOUBLE PRECISION,  -- OBIS: 1.0.3.8.0.255
    daily_reactive_export DOUBLE PRECISION,  -- OBIS: 1.0.4.8.0.255
    daily_apparent_import DOUBLE PRECISION,  -- OBIS: 1.0.9.8.0.255
    daily_apparent_export DOUBLE PRECISION,  -- OBIS: 1.0.10.8.0.255
    -- Maximum demand
    max_demand_import DOUBLE PRECISION,  -- OBIS: 1.0.1.6.0.255
    max_demand_import_time TIMESTAMPTZ,
    max_demand_export DOUBLE PRECISION,  -- OBIS: 1.0.2.6.0.255
    max_demand_export_time TIMESTAMPTZ,
    -- Daily statistics
    avg_power_factor DOUBLE PRECISION,
    avg_voltage_l1 DOUBLE PRECISION,
    avg_voltage_l2 DOUBLE PRECISION,
    avg_voltage_l3 DOUBLE PRECISION,
    avg_current_l1 DOUBLE PRECISION,
    avg_current_l2 DOUBLE PRECISION,
    avg_current_l3 DOUBLE PRECISION,
    -- Status information
    number_of_power_failures INTEGER,
    cumulative_power_failure_duration INTEGER, -- in minutes
    number_of_voltage_sags INTEGER,
    number_of_voltage_swells INTEGER,
    validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Convert daily_load_profiles to TimescaleDB hypertable
SELECT create_hypertable(
    'daily_load_profiles',
    'capture_date',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

CREATE INDEX idx_daily_load_profiles_meter_date ON daily_load_profiles(meter_id, capture_date DESC);

-- Billing Profile Table
CREATE TABLE billing_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    billing_date DATE NOT NULL,
    reset_count INTEGER,
    -- Cumulative readings at billing time
    cumulative_energy_import DOUBLE PRECISION,  -- OBIS: 1.0.1.8.0.255
    cumulative_energy_export DOUBLE PRECISION,  -- OBIS: 1.0.2.8.0.255
    cumulative_reactive_import DOUBLE PRECISION,  -- OBIS: 1.0.3.8.0.255
    cumulative_reactive_export DOUBLE PRECISION,  -- OBIS: 1.0.4.8.0.255
    cumulative_apparent_import DOUBLE PRECISION,  -- OBIS: 1.0.9.8.0.255
    cumulative_apparent_export DOUBLE PRECISION,  -- OBIS: 1.0.10.8.0.255
    -- Maximum demand since last billing
    max_demand_import DOUBLE PRECISION,  -- OBIS: 1.0.1.6.0.255
    max_demand_import_time TIMESTAMPTZ,
    max_demand_export DOUBLE PRECISION,  -- OBIS: 1.0.2.6.0.255
    max_demand_export_time TIMESTAMPTZ,
    -- Time of Use (TOU) energy readings
    tou_energy_import_rate1 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.1.255
    tou_energy_import_rate2 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.2.255
    tou_energy_import_rate3 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.3.255
    tou_energy_import_rate4 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.4.255
    -- Billing status
    billing_status_word VARCHAR(32),
    validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_billing_profiles_meter_date ON billing_profiles(meter_id, billing_date DESC);

-- Load Profile Status Table
CREATE TABLE profile_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    profile_type VARCHAR(20) NOT NULL,
    last_capture_time TIMESTAMPTZ,
    capture_success_count BIGINT DEFAULT 0,
    capture_failure_count BIGINT DEFAULT 0,
    last_error_message TEXT,
    last_error_time TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_profile_type CHECK (
        profile_type IN (
            'INSTANTANEOUS',
            'BLOCK_LOAD',
            'DAILY_LOAD',
            'BILLING'
        )
    )
);

CREATE INDEX idx_profile_status_meter ON profile_status(meter_id, profile_type);


-- Create Instantaneous Profile table
CREATE TABLE instantaneous_profiles (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(id),
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Block Load Profile table
CREATE TABLE block_load_profiles (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(id),
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Daily Load Profile table
CREATE TABLE daily_load_profiles (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(id),
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Billing Profile table
CREATE TABLE billing_profiles (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(id),
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Event Types table
CREATE TABLE event_types (
    id SERIAL PRIMARY KEY,
    event_group VARCHAR(50) NOT NULL,
    event_code INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(id),
    event_type_id INTEGER REFERENCES event_types(id),
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create Firmware Upgrades table
CREATE TABLE firmware_upgrades (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(id),
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
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create ESWF Alarms table
CREATE TABLE eswf_alarms (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(id),
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create TimescaleDB hypertables
SELECT create_hypertable('instantaneous_profiles', 'capture_time');
SELECT create_hypertable('block_load_profiles', 'capture_time');
SELECT create_hypertable('daily_load_profiles', 'capture_time');
SELECT create_hypertable('billing_profiles', 'billing_date');
SELECT create_hypertable('events', 'event_datetime');
SELECT create_hypertable('eswf_alarms', 'alarm_datetime');