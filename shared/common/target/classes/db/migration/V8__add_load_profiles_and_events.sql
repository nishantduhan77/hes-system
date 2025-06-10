-- Daily Block Load Profile table
CREATE TABLE daily_load_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_time TIMESTAMPTZ NOT NULL,
    rtc_time TIMESTAMPTZ,
    block_interval INTEGER NOT NULL, -- in minutes
    active_energy_import DOUBLE PRECISION,
    active_energy_export DOUBLE PRECISION,
    reactive_energy_import DOUBLE PRECISION,
    reactive_energy_export DOUBLE PRECISION,
    apparent_energy DOUBLE PRECISION,
    average_voltage_l1 DOUBLE PRECISION,
    average_voltage_l2 DOUBLE PRECISION,
    average_voltage_l3 DOUBLE PRECISION,
    average_current_l1 DOUBLE PRECISION,
    average_current_l2 DOUBLE PRECISION,
    average_current_l3 DOUBLE PRECISION,
    power_factor DOUBLE PRECISION,
    frequency DOUBLE PRECISION,
    obis_code VARCHAR(20) NOT NULL DEFAULT '1.0.99.1.0.255', -- Standard OBIS code for load profile
    status_word INTEGER,
    validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Convert daily load profile to hypertable
SELECT create_hypertable(
    'daily_load_profile',
    'capture_time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for daily load profile
CREATE INDEX idx_daily_load_meter_time ON daily_load_profile(meter_id, capture_time DESC);
CREATE INDEX idx_daily_load_obis ON daily_load_profile(obis_code, capture_time DESC);

-- Instantaneous Profile table
CREATE TABLE instantaneous_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    capture_time TIMESTAMPTZ NOT NULL,
    rtc_time TIMESTAMPTZ,
    voltage_l1 DOUBLE PRECISION,
    voltage_l2 DOUBLE PRECISION,
    voltage_l3 DOUBLE PRECISION,
    current_l1 DOUBLE PRECISION,
    current_l2 DOUBLE PRECISION,
    current_l3 DOUBLE PRECISION,
    active_power_import_total DOUBLE PRECISION,
    active_power_export_total DOUBLE PRECISION,
    active_power_import_l1 DOUBLE PRECISION,
    active_power_import_l2 DOUBLE PRECISION,
    active_power_import_l3 DOUBLE PRECISION,
    active_power_export_l1 DOUBLE PRECISION,
    active_power_export_l2 DOUBLE PRECISION,
    active_power_export_l3 DOUBLE PRECISION,
    reactive_power_import_total DOUBLE PRECISION,
    reactive_power_export_total DOUBLE PRECISION,
    power_factor_total DOUBLE PRECISION,
    power_factor_l1 DOUBLE PRECISION,
    power_factor_l2 DOUBLE PRECISION,
    power_factor_l3 DOUBLE PRECISION,
    frequency DOUBLE PRECISION,
    apparent_power_total DOUBLE PRECISION,
    apparent_power_l1 DOUBLE PRECISION,
    apparent_power_l2 DOUBLE PRECISION,
    apparent_power_l3 DOUBLE PRECISION,
    phase_angle_l1 DOUBLE PRECISION,
    phase_angle_l2 DOUBLE PRECISION,
    phase_angle_l3 DOUBLE PRECISION,
    obis_code VARCHAR(20) NOT NULL DEFAULT '1.0.94.91.0.255', -- Standard OBIS code for instantaneous values
    status_word INTEGER,
    validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Convert instantaneous profile to hypertable
SELECT create_hypertable(
    'instantaneous_profile',
    'capture_time',
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Create indexes for instantaneous profile
CREATE INDEX idx_inst_meter_time ON instantaneous_profile(meter_id, capture_time DESC);
CREATE INDEX idx_inst_obis ON instantaneous_profile(obis_code, capture_time DESC);

-- Event Categories table
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    obis_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard event categories with their OBIS codes
INSERT INTO event_categories (category_name, description, severity, obis_code) VALUES
    ('POWER_QUALITY', 'Power quality related events', 'MEDIUM', '0.0.96.11.0.255'),
    ('POWER_FAILURE', 'Power failure events', 'HIGH', '0.0.96.7.0.255'),
    ('FIRMWARE_EVENTS', 'Firmware update events', 'LOW', '0.0.96.2.0.255'),
    ('CONFIGURATION_EVENTS', 'Configuration change events', 'MEDIUM', '0.0.96.3.0.255'),
    ('COMMUNICATION_EVENTS', 'Communication related events', 'MEDIUM', '0.0.96.4.0.255'),
    ('SECURITY_EVENTS', 'Security and authentication events', 'HIGH', '0.0.96.5.0.255'),
    ('BILLING_EVENTS', 'Billing and tariff events', 'HIGH', '0.0.96.6.0.255'),
    ('DIAGNOSTIC_EVENTS', 'Meter diagnostic events', 'LOW', '0.0.96.8.0.255'),
    ('TAMPER_EVENTS', 'Tampering and fraud events', 'HIGH', '0.0.96.9.0.255'),
    ('DISCONNECT_EVENTS', 'Disconnect/reconnect events', 'MEDIUM', '0.0.96.10.0.255');

-- Segregated Events table
CREATE TABLE segregated_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    category_id UUID NOT NULL REFERENCES event_categories(id),
    event_time TIMESTAMPTZ NOT NULL,
    rtc_time TIMESTAMPTZ,
    event_code INTEGER NOT NULL,
    event_description TEXT,
    additional_data JSONB,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Convert segregated events to hypertable
SELECT create_hypertable(
    'segregated_events',
    'event_time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for segregated events
CREATE INDEX idx_events_meter_time ON segregated_events(meter_id, event_time DESC);
CREATE INDEX idx_events_category ON segregated_events(category_id, event_time DESC);
CREATE INDEX idx_events_code ON segregated_events(event_code);
CREATE INDEX idx_events_acknowledged ON segregated_events(acknowledged, event_time DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_daily_load_updated_at
    BEFORE UPDATE ON daily_load_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inst_profile_updated_at
    BEFORE UPDATE ON instantaneous_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_categories_updated_at
    BEFORE UPDATE ON event_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_segregated_events_updated_at
    BEFORE UPDATE ON segregated_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at(); 