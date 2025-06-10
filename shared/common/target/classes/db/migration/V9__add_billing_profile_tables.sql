-- Billing Profile Table
CREATE TABLE billing_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_time TIMESTAMPTZ NOT NULL,
    buffer_size INTEGER NOT NULL,
    capture_objects_count INTEGER NOT NULL,
    capture_period BIGINT NOT NULL,
    sort_method INTEGER NOT NULL DEFAULT 1,
    sort_object INTEGER,
    entries_in_use BIGINT,
    profile_entries BIGINT,
    obis_code VARCHAR(20) NOT NULL DEFAULT '1.0.98.1.0.255',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Billing Profile Capture Objects Table
CREATE TABLE billing_profile_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_profile_id UUID NOT NULL REFERENCES billing_profiles(id),
    capture_time TIMESTAMPTZ NOT NULL,
    billing_date TIMESTAMP,  -- OBIS: 0.0.0.1.2.255
    system_bp_import DOUBLE PRECISION,  -- OBIS: 1.0.13.0.0.255
    -- Cumulative Energy Wh Import TZ1-TZ8
    cum_energy_wh_import_tz1 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.1.255
    cum_energy_wh_import_tz2 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.2.255
    cum_energy_wh_import_tz3 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.3.255
    cum_energy_wh_import_tz4 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.4.255
    cum_energy_wh_import_tz5 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.5.255
    cum_energy_wh_import_tz6 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.6.255
    cum_energy_wh_import_tz7 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.7.255
    cum_energy_wh_import_tz8 DOUBLE PRECISION,  -- OBIS: 1.0.1.8.8.255
    -- Cumulative Energy VAh Import TZ1-TZ8
    cum_energy_vah_import_tz1 DOUBLE PRECISION,  -- OBIS: 1.0.9.8.1.255
    cum_energy_vah_import_tz2 DOUBLE PRECISION,  -- OBIS: 1.0.9.8.2.255
    cum_energy_vah_import_tz3 DOUBLE PRECISION,  -- OBIS: 1.0.9.8.3.255
    cum_energy_vah_import_tz4 DOUBLE PRECISION,  -- OBIS: 1.0.9.8.4.255
    cum_energy_vah_import_tz5 DOUBLE PRECISION,  -- OBIS: 1.0.9.8.5.255
    cum_energy_vah_import_tz6 DOUBLE PRECISION,  -- OBIS: 1.0.9.8.6.255
    cum_energy_vah_import_tz7 DOUBLE PRECISION,  -- OBIS: 1.0.9.8.7.255
    cum_energy_vah_import_tz8 DOUBLE PRECISION,  -- OBIS: 1.0.9.8.8.255
    -- Maximum Demand Wh Import TZ1-TZ8
    md_w_import DOUBLE PRECISION,  -- OBIS: 1.0.1.6.0.255
    md_w_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.0.255
    md_w_import_tz1 DOUBLE PRECISION,  -- OBIS: 1.0.1.6.1.255
    md_w_tz1_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.1.255
    md_w_import_tz2 DOUBLE PRECISION,  -- OBIS: 1.0.1.6.2.255
    md_w_tz2_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.2.255
    md_w_import_tz3 DOUBLE PRECISION,  -- OBIS: 1.0.1.6.3.255
    md_w_tz3_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.3.255
    md_w_import_tz4 DOUBLE PRECISION,  -- OBIS: 1.0.1.6.4.255
    md_w_tz4_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.4.255
    md_w_import_tz5 DOUBLE PRECISION,  -- OBIS: 1.0.1.6.5.255
    md_w_tz5_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.5.255
    md_w_import_tz6 DOUBLE PRECISION,  -- OBIS: 1.0.1.6.6.255
    md_w_tz6_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.6.255
    md_w_import_tz7 DOUBLE PRECISION,  -- OBIS: 1.0.1.6.7.255
    md_w_tz7_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.7.255
    md_w_import_tz8 DOUBLE PRECISION,  -- OBIS: 1.0.1.6.8.255
    md_w_tz8_date_time TIMESTAMP,  -- OBIS: 1.0.1.6.8.255
    -- Maximum Demand VAh Import TZ1-TZ8
    md_va_import DOUBLE PRECISION,  -- OBIS: 1.0.9.6.0.255
    md_va_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.0.255
    md_va_import_tz1 DOUBLE PRECISION,  -- OBIS: 1.0.9.6.1.255
    md_va_tz1_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.1.255
    md_va_import_tz2 DOUBLE PRECISION,  -- OBIS: 1.0.9.6.2.255
    md_va_tz2_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.2.255
    md_va_import_tz3 DOUBLE PRECISION,  -- OBIS: 1.0.9.6.3.255
    md_va_tz3_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.3.255
    md_va_import_tz4 DOUBLE PRECISION,  -- OBIS: 1.0.9.6.4.255
    md_va_tz4_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.4.255
    md_va_import_tz5 DOUBLE PRECISION,  -- OBIS: 1.0.9.6.5.255
    md_va_tz5_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.5.255
    md_va_import_tz6 DOUBLE PRECISION,  -- OBIS: 1.0.9.6.6.255
    md_va_tz6_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.6.255
    md_va_import_tz7 DOUBLE PRECISION,  -- OBIS: 1.0.9.6.7.255
    md_va_tz7_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.7.255
    md_va_import_tz8 DOUBLE PRECISION,  -- OBIS: 1.0.9.6.8.255
    md_va_tz8_date_time TIMESTAMP,  -- OBIS: 1.0.9.6.8.255
    -- Additional billing parameters
    billing_power_on_duration INTEGER,  -- OBIS: 0.0.94.91.13.255
    cum_energy_wh_export DOUBLE PRECISION,  -- OBIS: 1.0.2.8.0.255
    cum_energy_vah_q1 DOUBLE PRECISION,  -- OBIS: 1.0.5.8.0.255
    cum_energy_vah_q2 DOUBLE PRECISION,  -- OBIS: 1.0.6.8.0.255
    cum_energy_vah_q3 DOUBLE PRECISION,  -- OBIS: 1.0.7.8.0.255
    cum_energy_vah_q4 DOUBLE PRECISION,  -- OBIS: 1.0.8.8.0.255
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Drop dependent foreign key constraints first
ALTER TABLE billing_profile_captures DROP CONSTRAINT IF EXISTS billing_profile_captures_billing_profile_id_fkey;

-- Now drop the primary key constraint
ALTER TABLE billing_profiles DROP CONSTRAINT IF EXISTS billing_profiles_pkey;

-- Convert billing_profiles to hypertable
SELECT create_hypertable(
    'billing_profiles',
    'capture_time',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE,
    migrate_data => TRUE,
    create_default_indexes => FALSE
);

-- Recreate the primary key to include the partitioning column
CREATE UNIQUE INDEX idx_billing_profiles_id_time ON billing_profiles(id, capture_time);
ALTER TABLE billing_profiles ADD PRIMARY KEY (id, capture_time);

-- Recreate the foreign key constraint
ALTER TABLE billing_profile_captures 
    ADD CONSTRAINT billing_profile_captures_billing_profile_id_fkey 
    FOREIGN KEY (billing_profile_id, capture_time) 
    REFERENCES billing_profiles(id, capture_time);

-- Convert billing_profile_captures to hypertable
ALTER TABLE billing_profile_captures DROP CONSTRAINT billing_profile_captures_pkey;
-- Cannot create hypertable since billing_profiles is a hypertable and we need to reference it
-- Instead create regular table with indexes for time-based queries
CREATE INDEX idx_billing_captures_time ON billing_profile_captures(capture_time DESC);
CREATE UNIQUE INDEX idx_billing_captures_id_time ON billing_profile_captures(id, capture_time);
ALTER TABLE billing_profile_captures ADD PRIMARY KEY (id, capture_time);

-- Create indexes for efficient querying
CREATE INDEX idx_billing_profiles_meter ON billing_profiles(meter_id, capture_time DESC);
CREATE INDEX idx_billing_captures_profile ON billing_profile_captures(billing_profile_id, capture_time DESC);

-- Create time zone slots table
CREATE TABLE billing_time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_number INTEGER NOT NULL,
    start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour < 24),
    end_hour INTEGER NOT NULL CHECK (end_hour > 0 AND end_hour <= 24),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_slot_number UNIQUE (slot_number),
    CONSTRAINT valid_hours CHECK (start_hour < end_hour)
);

-- Insert default time slots as shown in the image
INSERT INTO billing_time_slots (slot_number, start_hour, end_hour, description) VALUES
    (1, 17, 18, 'Time Slot 1'),
    (2, 18, 22, 'Time Slot 2'),
    (3, 22, 23, 'Time Slot 3'),
    (4, 0, 5, 'Time Slot 4'), -- Changed 23 to 0 to avoid violating valid_hours check
    (5, 5, 6, 'Time Slot 5'),
    (6, 6, 8, 'Time Slot 6'),
    (7, 8, 11, 'Time Slot 7'),
    (8, 11, 17, 'Time Slot 8');

-- Add triggers for updated_at
CREATE TRIGGER update_billing_profiles_updated_at
    BEFORE UPDATE ON billing_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_billing_captures_updated_at
    BEFORE UPDATE ON billing_profile_captures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_billing_slots_updated_at
    BEFORE UPDATE ON billing_time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Daily Load Profile Table (OBIS: 1.0.99.2.0.255)
CREATE TABLE daily_load_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_time TIMESTAMPTZ NOT NULL,
    buffer_size INTEGER NOT NULL,
    capture_objects_count INTEGER NOT NULL,
    capture_period BIGINT NOT NULL DEFAULT 86400, -- Fixed value of 86400 seconds (1 day)
    sort_method INTEGER NOT NULL DEFAULT 1, -- FIFO
    sort_object INTEGER,
    entries_in_use BIGINT,  -- Current number of entries in buffer
    profile_entries BIGINT,  -- Max number of captures in buffer - static
    obis_code VARCHAR(20) NOT NULL DEFAULT '1.0.99.2.0.255',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Daily Load Profile Captures Table
CREATE TABLE daily_load_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    capture_time TIMESTAMPTZ NOT NULL,
    rtc_time VARCHAR(12),  -- OBIS: 0.0.1.0.0.255
    -- Current measurements
    current_ir DOUBLE PRECISION,  -- OBIS: 1.0.31.27.0.255
    current_iy DOUBLE PRECISION,  -- OBIS: 1.0.51.27.0.255
    current_ib DOUBLE PRECISION,  -- OBIS: 1.0.71.27.0.255
    -- Voltage measurements
    voltage_vrn DOUBLE PRECISION,  -- OBIS: 1.0.32.27.0.255
    voltage_vyn DOUBLE PRECISION,  -- OBIS: 1.0.52.27.0.255
    voltage_vbn DOUBLE PRECISION,  -- OBIS: 1.0.72.27.0.255
    -- Block Energy measurements
    block_energy_wh_import DOUBLE PRECISION,  -- OBIS: 1.0.1.29.0.255
    block_energy_wh_export DOUBLE PRECISION,  -- OBIS: 1.0.2.29.0.255
    block_energy_vah_q1 DOUBLE PRECISION,  -- OBIS: 1.0.5.29.0.255
    block_energy_vah_q2 DOUBLE PRECISION,  -- OBIS: 1.0.6.29.0.255
    block_energy_vah_q3 DOUBLE PRECISION,  -- OBIS: 1.0.7.29.0.255
    block_energy_vah_q4 DOUBLE PRECISION,  -- OBIS: 1.0.8.29.0.255
    block_energy_vah_import DOUBLE PRECISION,  -- OBIS: 1.0.9.29.0.255
    block_energy_vah_export DOUBLE PRECISION,  -- OBIS: 1.0.10.29.0.255
    meter_health_indicator INTEGER,  -- OBIS: 0.0.96.10.1.255
    signal_strength INTEGER,  -- OBIS: 0.1.96.12.5.255
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Drop dependent foreign key constraints first
ALTER TABLE daily_load_captures DROP CONSTRAINT IF EXISTS daily_load_captures_profile_id_fkey;

-- Now drop the primary key constraint from both tables
ALTER TABLE daily_load_captures DROP CONSTRAINT IF EXISTS daily_load_captures_pkey;
ALTER TABLE daily_load_profiles DROP CONSTRAINT IF EXISTS daily_load_profiles_pkey;

-- Convert daily_load_profiles to hypertable
-- Drop primary key first to avoid dependency issues
ALTER TABLE daily_load_profiles DROP CONSTRAINT IF EXISTS daily_load_profiles_pkey CASCADE;

-- Create unique index including partitioning column before creating hypertable
CREATE UNIQUE INDEX idx_daily_profiles_id_time ON daily_load_profiles(id, capture_time);

-- Convert to hypertable
SELECT create_hypertable(
    'daily_load_profiles',
    'capture_time',
    chunk_time_interval => INTERVAL '90 days',
    if_not_exists => TRUE,
    migrate_data => TRUE,
    create_default_indexes => FALSE
);

-- Create indexes and primary keys
CREATE UNIQUE INDEX idx_daily_profiles_id_time ON daily_load_profiles(id, capture_time);
ALTER TABLE daily_load_profiles ADD PRIMARY KEY (id, capture_time);

-- Create regular table indexes for daily_load_captures
CREATE INDEX idx_daily_captures_time ON daily_load_captures(capture_time DESC);
CREATE UNIQUE INDEX idx_daily_captures_id_time ON daily_load_captures(id, capture_time);
ALTER TABLE daily_load_captures ADD PRIMARY KEY (id, capture_time);

-- Add the foreign key constraint with composite reference
ALTER TABLE daily_load_captures 
    ADD CONSTRAINT daily_load_captures_profile_id_fkey 
    FOREIGN KEY (daily_profile_id, capture_time) 
    REFERENCES daily_load_profiles(id, capture_time);

-- Create indexes for efficient querying
CREATE INDEX idx_daily_profiles_meter ON daily_load_profiles(meter_id, capture_time DESC);
CREATE INDEX idx_daily_captures_profile ON daily_load_captures(daily_profile_id, capture_time DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_daily_profiles_updated_at
    BEFORE UPDATE ON daily_load_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_daily_captures_updated_at
    BEFORE UPDATE ON daily_load_captures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Instantaneous Parameters Profile Table (OBIS: 1.0.94.91.0.255)
CREATE TABLE instantaneous_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_time TIMESTAMPTZ NOT NULL,
    buffer_size INTEGER NOT NULL,
    capture_objects_count INTEGER NOT NULL,
    capture_period BIGINT DEFAULT 0,  -- Set to 0 for on-demand immediate data capture
    sort_method INTEGER NOT NULL DEFAULT 1,  -- FIFO
    sort_object INTEGER,
    entries_in_use BIGINT DEFAULT 1,  -- Current number of entries in buffer: 1
    profile_entries BIGINT DEFAULT 1,  -- Should be limited to 1
    obis_code VARCHAR(20) NOT NULL DEFAULT '1.0.94.91.0.255',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Instantaneous Parameters Captures Table
CREATE TABLE instantaneous_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES instantaneous_profiles(id),
    capture_time TIMESTAMPTZ NOT NULL,
    rtc_time VARCHAR(12),  -- OBIS: 0.0.1.0.0.255
    -- Current measurements
    l1_current_ir DOUBLE PRECISION,  -- OBIS: 1.0.31.7.0.255
    l2_current_iy DOUBLE PRECISION,  -- OBIS: 1.0.51.7.0.255
    l3_current_ib DOUBLE PRECISION,  -- OBIS: 1.0.71.7.0.255
    -- Voltage measurements
    l1_voltage_vrn DOUBLE PRECISION,  -- OBIS: 1.0.32.7.0.255
    l2_voltage_vyn DOUBLE PRECISION,  -- OBIS: 1.0.52.7.0.255
    l3_voltage_vbn DOUBLE PRECISION,  -- OBIS: 1.0.72.7.0.255
    -- Power factor measurements
    l1_power_factor DOUBLE PRECISION,  -- OBIS: 1.0.33.7.0.255
    l2_power_factor DOUBLE PRECISION,  -- OBIS: 1.0.53.7.0.255
    l3_power_factor DOUBLE PRECISION,  -- OBIS: 1.0.73.7.0.255
    three_phase_power_factor DOUBLE PRECISION,  -- OBIS: 1.0.13.7.0.255
    frequency DOUBLE PRECISION,  -- OBIS: 1.0.14.7.0.255
    apparent_power_va DOUBLE PRECISION,  -- OBIS: 1.0.9.7.0.255
    active_power_w DOUBLE PRECISION,  -- OBIS: 1.0.1.7.0.255
    reactive_power_var DOUBLE PRECISION,  -- OBIS: 1.0.3.7.0.255
    -- Additional parameters
    power_failures BIGINT,  -- OBIS: 0.0.96.7.0.255
    power_off_duration_minutes BIGINT,  -- OBIS: 0.0.94.91.8.255
    tamper_count BIGINT,  -- OBIS: 0.0.94.91.0.255
    billing_count BIGINT,  -- OBIS: 0.0.0.1.0.255
    programming_count BIGINT,  -- OBIS: 0.0.96.2.0.255
    last_billing_date VARCHAR(12),  -- OBIS: 0.0.0.1.2.255
    -- Energy measurements
    cum_energy_wh_import DOUBLE PRECISION,  -- OBIS: 1.0.1.8.0.255
    cum_energy_wh_export DOUBLE PRECISION,  -- OBIS: 1.0.2.8.0.255
    cum_energy_vah_q1 DOUBLE PRECISION,  -- OBIS: 1.0.5.8.0.255
    cum_energy_vah_q2 DOUBLE PRECISION,  -- OBIS: 1.0.6.8.0.255
    cum_energy_vah_q3 DOUBLE PRECISION,  -- OBIS: 1.0.7.8.0.255
    cum_energy_vah_q4 DOUBLE PRECISION,  -- OBIS: 1.0.8.8.0.255
    cum_energy_vah_import DOUBLE PRECISION,  -- OBIS: 1.0.9.8.0.255
    cum_energy_vah_export DOUBLE PRECISION,  -- OBIS: 1.0.10.8.0.255
    -- Maximum demand measurements
    max_demand_active_import_w DOUBLE PRECISION,  -- OBIS: 1.0.1.6.0.255
    max_demand_active_datetime VARCHAR(12),  -- OBIS: 1.0.1.6.0.255
    max_demand_apparent_import_va DOUBLE PRECISION,  -- OBIS: 1.0.9.6.0.255
    max_demand_apparent_datetime VARCHAR(12),  -- OBIS: 1.0.9.6.0.255
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Block Load Profile Table (OBIS: 1.0.99.1.0.255)
CREATE TABLE block_load_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_time TIMESTAMPTZ NOT NULL,
    buffer_size INTEGER NOT NULL,
    capture_objects_count INTEGER NOT NULL,
    capture_period BIGINT NOT NULL,
    sort_method INTEGER NOT NULL DEFAULT 1,  -- FIFO
    sort_object INTEGER,
    entries_in_use BIGINT,  -- Current number of entries in buffer
    profile_entries BIGINT,  -- Max number of captures in buffer - static
    obis_code VARCHAR(20) NOT NULL DEFAULT '1.0.99.1.0.255',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Block Load Profile Captures Table
CREATE TABLE block_load_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES block_load_profiles(id),
    capture_time TIMESTAMPTZ NOT NULL,
    rtc_time VARCHAR(12),  -- OBIS: 0.0.1.0.0.255
    -- Current measurements
    current_ir DOUBLE PRECISION,  -- OBIS: 1.0.31.27.0.255
    current_iy DOUBLE PRECISION,  -- OBIS: 1.0.51.27.0.255
    current_ib DOUBLE PRECISION,  -- OBIS: 1.0.71.27.0.255
    -- Voltage measurements
    voltage_vrn DOUBLE PRECISION,  -- OBIS: 1.0.32.27.0.255
    voltage_vyn DOUBLE PRECISION,  -- OBIS: 1.0.52.27.0.255
    voltage_vbn DOUBLE PRECISION,  -- OBIS: 1.0.72.27.0.255
    -- Block Energy measurements
    block_energy_wh_import DOUBLE PRECISION,  -- OBIS: 1.0.1.29.0.255
    block_energy_wh_export DOUBLE PRECISION,  -- OBIS: 1.0.2.29.0.255
    block_energy_vah_q1 DOUBLE PRECISION,  -- OBIS: 1.0.5.29.0.255
    block_energy_vah_q2 DOUBLE PRECISION,  -- OBIS: 1.0.6.29.0.255
    block_energy_vah_q3 DOUBLE PRECISION,  -- OBIS: 1.0.7.29.0.255
    block_energy_vah_q4 DOUBLE PRECISION,  -- OBIS: 1.0.8.29.0.255
    block_energy_vah_import DOUBLE PRECISION,  -- OBIS: 1.0.9.29.0.255
    block_energy_vah_export DOUBLE PRECISION,  -- OBIS: 1.0.10.29.0.255
    meter_health_indicator INTEGER,  -- OBIS: 0.0.96.10.1.255
    signal_strength INTEGER,  -- OBIS: 0.1.96.12.5.255
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Event Log Table
CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    event_time TIMESTAMPTZ NOT NULL,
    event_code INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    obis_code VARCHAR(20) NOT NULL,
    event_sequence_number BIGINT,
    rtc_time VARCHAR(12),
    current_ir DOUBLE PRECISION,
    current_iy DOUBLE PRECISION,
    current_ib DOUBLE PRECISION,
    voltage_vrn DOUBLE PRECISION,
    voltage_vyn DOUBLE PRECISION,
    voltage_vbn DOUBLE PRECISION,
    power_factor_r DOUBLE PRECISION,
    power_factor_y DOUBLE PRECISION,
    power_factor_b DOUBLE PRECISION,
    cum_energy_wh_import DOUBLE PRECISION,
    cum_energy_wh_export DOUBLE PRECISION,
    additional_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Event Categories Table
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(50) NOT NULL,
    obis_code VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard event categories
INSERT INTO event_categories (category_name, obis_code, description, severity) VALUES
    ('VOLTAGE_RELATED', '0.0.96.11.0.255', 'Voltage related events', 'WARNING'),
    ('CURRENT_RELATED', '0.0.96.11.1.255', 'Current related events', 'WARNING'), 
    ('POWER_RELATED', '0.0.96.11.2.255', 'Power related events', 'WARNING'),
    ('TRANSACTION_RELATED', '0.0.96.11.3.255', 'Transaction related events', 'INFO'),
    ('OTHERS', '0.0.96.11.4.255', 'Other events', 'INFO');

-- ESWF Configuration Table
CREATE TABLE eswf_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    byte_number INTEGER NOT NULL,
    bit_number INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_byte_bit UNIQUE (meter_id, byte_number, bit_number)
);

-- Insert ESWF standard configurations
-- Insert ESWF standard configurations
-- First, insert a default meter if it doesn't exist
INSERT INTO meters (meter_id, meter_code, serial_number, manufacturer, model, meter_type, location, installation_date, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT', CURRENT_TIMESTAMP, 'ACTIVE')
ON CONFLICT (meter_id) DO NOTHING;

-- Now insert the ESWF configurations
INSERT INTO eswf_configurations (meter_id, byte_number, bit_number, description) 
SELECT '00000000-0000-0000-0000-000000000000', byte_number, bit_number, description
FROM (VALUES
    (0, 1, 'R Phase Voltage Missing'),
    (0, 2, 'Y Phase Voltage Missing'),
    (0, 3, 'B Phase Voltage Missing'),
    (0, 4, 'Low Voltage'),
    (0, 5, 'Over Voltage'),
    (0, 6, 'R Phase current reverse'),
    (0, 7, 'Y Phase current reverse'),
    (0, 8, 'B Phase current reverse'),
    (0, 9, 'Current Unbalance'),
    (0, 10, 'Current Short/Open'),
    (83, 1, 'Influence of permanent magnet'),
    (83, 2, 'Neutral Disturbance'),
    (104, 1, 'D-PORT 1 Push'),
    (104, 2, 'D-PORT 2 Push'),
    (116, 1, 'Temperature Rise'),
    (122, 1, 'R PH CT Open'),
    (123, 1, 'Y PH CT Open'),
    (124, 1, 'B PH CT Open'),
    (126, 1, 'High Neutral Current')
) AS t(byte_number, bit_number, description)
WHERE EXISTS (SELECT 1 FROM meters WHERE meter_id = '00000000-0000-0000-0000-000000000000');

-- Convert tables to hypertables
ALTER TABLE instantaneous_profiles DROP CONSTRAINT instantaneous_profiles_pkey;
-- First drop any foreign key constraints that reference the primary key
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('ALTER TABLE ' || quote_ident(r.relname) || 
                         ' DROP CONSTRAINT ' || quote_ident(c.conname), '; ')
        FROM pg_constraint c
        JOIN pg_class r ON r.oid = c.conrelid
        WHERE confrelid = 'instantaneous_profiles'::regclass
    );
END $$;

-- Now drop the primary key constraint
ALTER TABLE instantaneous_profiles DROP CONSTRAINT instantaneous_profiles_pkey;

-- Create the hypertable
SELECT create_hypertable(
    'instantaneous_profiles',
    'capture_time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE,
    migrate_data => TRUE,
    create_default_indexes => FALSE
);

ALTER TABLE block_load_profiles DROP CONSTRAINT block_load_profiles_pkey;
-- First drop any foreign key constraints that reference the primary key
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('ALTER TABLE ' || quote_ident(r.relname) || 
                         ' DROP CONSTRAINT ' || quote_ident(c.conname), '; ')
        FROM pg_constraint c
        JOIN pg_class r ON r.oid = c.conrelid
        WHERE confrelid = 'block_load_profiles'::regclass
    );
END $$;

-- Now drop the primary key constraint
ALTER TABLE block_load_profiles DROP CONSTRAINT block_load_profiles_pkey;

-- Create the hypertable
SELECT create_hypertable(
    'block_load_profiles',
    'capture_time',
    chunk_time_interval => INTERVAL '90 days',
    if_not_exists => TRUE,
    migrate_data => TRUE,
    create_default_indexes => FALSE
);

ALTER TABLE event_logs DROP CONSTRAINT event_logs_pkey;
SELECT create_hypertable(
    'event_logs',
    'event_time',
    chunk_time_interval => INTERVAL '30 days',
    if_not_exists => TRUE,
    migrate_data => TRUE,
    create_default_indexes => FALSE
);

-- Create indexes
CREATE INDEX idx_inst_profiles_meter ON instantaneous_profiles(meter_id, capture_time DESC);
CREATE INDEX idx_block_profiles_meter ON block_load_profiles(meter_id, capture_time DESC);
CREATE INDEX idx_event_logs_meter ON event_logs(meter_id, event_time DESC);
CREATE INDEX idx_event_logs_type ON event_logs(event_type, event_time DESC);
CREATE INDEX idx_eswf_meter ON eswf_configurations(meter_id);

-- Add triggers
CREATE TRIGGER update_instantaneous_profiles_updated_at
    BEFORE UPDATE ON instantaneous_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_block_load_profiles_updated_at
    BEFORE UPDATE ON block_load_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_logs_updated_at
    BEFORE UPDATE ON event_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_eswf_configurations_updated_at
    BEFORE UPDATE ON eswf_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at(); 