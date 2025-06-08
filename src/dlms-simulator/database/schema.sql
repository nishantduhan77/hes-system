-- DLMS/COSEM Database Schema

-- OBIS Code Table
CREATE TABLE obis_codes (
    id SERIAL PRIMARY KEY,
    logical_name VARCHAR(50) NOT NULL UNIQUE,
    class_id INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_obis_logical_name ON obis_codes(logical_name);
CREATE INDEX idx_obis_class_id ON obis_codes(class_id);

-- Push Setup Table (class_id = 40)
CREATE TABLE push_setups (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    destination_and_method TEXT,
    communication_window JSONB,
    randomisation_start_interval INTEGER,
    number_of_retries INTEGER,
    repetition_delay INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_setups_obis ON push_setups(obis_code_id);

-- Push Object List Table
CREATE TABLE push_objects (
    id SERIAL PRIMARY KEY,
    push_setup_id INTEGER REFERENCES push_setups(id),
    class_id INTEGER NOT NULL,
    logical_name VARCHAR(50) NOT NULL,
    attribute_index INTEGER NOT NULL,
    data_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_objects_setup ON push_objects(push_setup_id);
CREATE INDEX idx_push_objects_logical_name ON push_objects(logical_name);

-- Push Schedule Table
CREATE TABLE push_schedules (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    schedule_type VARCHAR(20) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_schedule_type CHECK (
        schedule_type IN (
            'FIFTEEN_MIN', 'THIRTY_MIN', 'ONE_HOUR', 
            'FOUR_HOUR', 'EIGHT_HOUR', 'TWELVE_HOUR', 
            'TWENTY_FOUR_HOUR'
        )
    )
);

CREATE INDEX idx_push_schedules_obis ON push_schedules(obis_code_id);
CREATE INDEX idx_push_schedules_type ON push_schedules(schedule_type);

-- Schedule Entries Table
CREATE TABLE schedule_entries (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES push_schedules(id),
    date_pattern VARCHAR(20) NOT NULL,
    time_pattern VARCHAR(20) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedule_entries_schedule ON schedule_entries(schedule_id);

-- Energy Measurements Table
CREATE TABLE energy_measurements (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    timestamp TIMESTAMP NOT NULL,
    value DECIMAL(18,3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_energy_measurements_obis ON energy_measurements(obis_code_id);
CREATE INDEX idx_energy_measurements_timestamp ON energy_measurements(timestamp);

-- Voltage Measurements Table
CREATE TABLE voltage_measurements (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    phase VARCHAR(1) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_phase CHECK (phase IN ('R', 'Y', 'B'))
);

CREATE INDEX idx_voltage_measurements_obis ON voltage_measurements(obis_code_id);
CREATE INDEX idx_voltage_measurements_timestamp ON voltage_measurements(timestamp);
CREATE INDEX idx_voltage_measurements_phase ON voltage_measurements(phase);

-- Current Measurements Table
CREATE TABLE current_measurements (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    phase VARCHAR(1) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    value DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_phase CHECK (phase IN ('R', 'Y', 'B'))
);

CREATE INDEX idx_current_measurements_obis ON current_measurements(obis_code_id);
CREATE INDEX idx_current_measurements_timestamp ON current_measurements(timestamp);
CREATE INDEX idx_current_measurements_phase ON current_measurements(phase);

-- Push History Table
CREATE TABLE push_history (
    id SERIAL PRIMARY KEY,
    push_setup_id INTEGER REFERENCES push_setups(id),
    schedule_id INTEGER REFERENCES push_schedules(id),
    timestamp TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('SUCCESS', 'FAILED', 'RETRY', 'CANCELLED'))
);

CREATE INDEX idx_push_history_setup ON push_history(push_setup_id);
CREATE INDEX idx_push_history_schedule ON push_history(schedule_id);
CREATE INDEX idx_push_history_timestamp ON push_history(timestamp);
CREATE INDEX idx_push_history_status ON push_history(status);

-- Insert default OBIS codes
INSERT INTO obis_codes (logical_name, class_id, description) VALUES
    ('0.0.96.1.0.255', 1, 'Configuration Parameters'),
    ('0.4.25.9.0.255', 40, 'Push Setup'),
    ('0.0.15.0.4.255', 1, 'Push Schedule'),
    ('1.0.31.7.0.255', 3, 'Current Ir'),
    ('1.0.51.7.0.255', 3, 'Current Iy'),
    ('1.0.71.7.0.255', 3, 'Current Ib'),
    ('1.0.32.7.0.255', 3, 'Voltage VRN'),
    ('1.0.52.7.0.255', 3, 'Voltage VYN'),
    ('1.0.72.7.0.255', 3, 'Voltage VBN'),
    ('1.0.1.8.0.255', 3, 'Cumulative energy kWh Import'),
    ('1.0.9.8.0.255', 3, 'Cumulative energy kvah Import'),
    ('1.0.2.8.0.255', 3, 'Cumulative energy kWh Export'),
    ('1.0.10.8.0.255', 3, 'Cumulative energy kvah Export'),
    ('0.0.1.0.0.255', 8, 'Clock'),
    ('0.0.96.1.2.255', 1, 'Device ID');

-- Create view for active schedules
CREATE VIEW active_schedules AS
SELECT 
    ps.id,
    ps.schedule_type,
    oc.logical_name,
    se.time_pattern,
    se.comment
FROM push_schedules ps
JOIN obis_codes oc ON ps.obis_code_id = oc.id
JOIN schedule_entries se ON se.schedule_id = ps.id
WHERE ps.is_enabled = true;

-- Create view for latest measurements
CREATE VIEW latest_measurements AS
SELECT 
    oc.logical_name,
    em.value as energy_value,
    em.unit as energy_unit,
    vm.value as voltage_value,
    cm.value as current_value,
    COALESCE(em.timestamp, vm.timestamp, cm.timestamp) as measurement_time
FROM obis_codes oc
LEFT JOIN energy_measurements em ON em.obis_code_id = oc.id
LEFT JOIN voltage_measurements vm ON vm.obis_code_id = oc.id
LEFT JOIN current_measurements cm ON cm.obis_code_id = oc.id
WHERE em.timestamp = (
    SELECT MAX(timestamp) 
    FROM energy_measurements 
    WHERE obis_code_id = oc.id
)
OR vm.timestamp = (
    SELECT MAX(timestamp) 
    FROM voltage_measurements 
    WHERE obis_code_id = oc.id
)
OR cm.timestamp = (
    SELECT MAX(timestamp) 
    FROM current_measurements 
    WHERE obis_code_id = oc.id
);

-- Create function to get next push schedule
CREATE OR REPLACE FUNCTION get_next_push_schedule(
    p_current_time TIMESTAMP
) RETURNS TABLE (
    schedule_id INTEGER,
    schedule_type VARCHAR(20),
    next_execution TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.schedule_type,
        CASE ps.schedule_type
            WHEN 'FIFTEEN_MIN' THEN 
                p_current_time + INTERVAL '15 minutes' 
                - INTERVAL '1 minute' * (EXTRACT(MINUTE FROM p_current_time)::INTEGER % 15)
            WHEN 'THIRTY_MIN' THEN 
                p_current_time + INTERVAL '30 minutes' 
                - INTERVAL '1 minute' * (EXTRACT(MINUTE FROM p_current_time)::INTEGER % 30)
            WHEN 'ONE_HOUR' THEN 
                p_current_time + INTERVAL '1 hour' 
                - INTERVAL '1 minute' * EXTRACT(MINUTE FROM p_current_time)::INTEGER
            WHEN 'FOUR_HOUR' THEN 
                p_current_time + INTERVAL '4 hours' 
                - INTERVAL '1 hour' * (EXTRACT(HOUR FROM p_current_time)::INTEGER % 4)
            WHEN 'EIGHT_HOUR' THEN 
                p_current_time + INTERVAL '8 hours' 
                - INTERVAL '1 hour' * (EXTRACT(HOUR FROM p_current_time)::INTEGER % 8)
            WHEN 'TWELVE_HOUR' THEN 
                p_current_time + INTERVAL '12 hours' 
                - INTERVAL '1 hour' * (EXTRACT(HOUR FROM p_current_time)::INTEGER % 12)
            ELSE 
                p_current_time + INTERVAL '1 day' 
                - INTERVAL '1 hour' * EXTRACT(HOUR FROM p_current_time)::INTEGER
        END as next_execution
    FROM push_schedules ps
    WHERE ps.is_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Load Profile Tables

-- Instantaneous Profile Table
CREATE TABLE instant_profile (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    timestamp TIMESTAMP NOT NULL,
    voltage_r DECIMAL(10,2),
    voltage_y DECIMAL(10,2),
    voltage_b DECIMAL(10,2),
    current_r DECIMAL(10,3),
    current_y DECIMAL(10,3),
    current_b DECIMAL(10,3),
    active_power_r DECIMAL(10,3),
    active_power_y DECIMAL(10,3),
    active_power_b DECIMAL(10,3),
    power_factor_r DECIMAL(5,3),
    power_factor_y DECIMAL(5,3),
    power_factor_b DECIMAL(5,3),
    frequency DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_instant_profile_timestamp ON instant_profile(timestamp);
CREATE INDEX idx_instant_profile_obis ON instant_profile(obis_code_id);

-- Block Load Profile Table
CREATE TABLE block_load_profile (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    capture_time TIMESTAMP NOT NULL,
    kWh_import DECIMAL(18,3),
    kWh_export DECIMAL(18,3),
    kVAh_import DECIMAL(18,3),
    kVAh_export DECIMAL(18,3),
    average_current_r DECIMAL(10,3),
    average_current_y DECIMAL(10,3),
    average_current_b DECIMAL(10,3),
    average_voltage_r DECIMAL(10,2),
    average_voltage_y DECIMAL(10,2),
    average_voltage_b DECIMAL(10,2),
    block_interval_minutes INTEGER,
    status_word VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_block_load_profile_capture_time ON block_load_profile(capture_time);
CREATE INDEX idx_block_load_profile_obis ON block_load_profile(obis_code_id);

-- Daily Load Profile Table
CREATE TABLE daily_load_profile (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    capture_date DATE NOT NULL,
    cumulative_kWh_import DECIMAL(18,3),
    cumulative_kWh_export DECIMAL(18,3),
    cumulative_kVAh_import DECIMAL(18,3),
    cumulative_kVAh_export DECIMAL(18,3),
    daily_kWh_import DECIMAL(18,3),
    daily_kWh_export DECIMAL(18,3),
    daily_kVAh_import DECIMAL(18,3),
    daily_kVAh_export DECIMAL(18,3),
    max_demand_kW DECIMAL(10,3),
    max_demand_time TIMESTAMP,
    power_factor DECIMAL(5,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_load_profile_capture_date ON daily_load_profile(capture_date);
CREATE INDEX idx_daily_load_profile_obis ON daily_load_profile(obis_code_id);

-- Billing Profile Table
CREATE TABLE billing_profile (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    billing_date DATE NOT NULL,
    reset_count INTEGER,
    cumulative_kWh_import DECIMAL(18,3),
    cumulative_kWh_export DECIMAL(18,3),
    cumulative_kVAh_import DECIMAL(18,3),
    cumulative_kVAh_export DECIMAL(18,3),
    monthly_kWh_import DECIMAL(18,3),
    monthly_kWh_export DECIMAL(18,3),
    monthly_kVAh_import DECIMAL(18,3),
    monthly_kVAh_export DECIMAL(18,3),
    max_demand_kW DECIMAL(10,3),
    max_demand_date TIMESTAMP,
    power_factor DECIMAL(5,3),
    billing_status_word VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_billing_profile_billing_date ON billing_profile(billing_date);
CREATE INDEX idx_billing_profile_obis ON billing_profile(obis_code_id);

-- Event Log Table
CREATE TABLE event_logs (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    event_timestamp TIMESTAMP NOT NULL,
    event_code INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    additional_data JSONB,
    acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_event_type CHECK (
        event_type IN (
            'POWER_FAILURE', 'VOLTAGE_RELATED', 'CURRENT_RELATED',
            'POWER_QUALITY', 'FIRMWARE', 'COMMUNICATION',
            'ACCESS', 'CONFIGURATION', 'CLOCK', 'BILLING'
        )
    )
);

CREATE INDEX idx_event_logs_timestamp ON event_logs(event_timestamp);
CREATE INDEX idx_event_logs_event_code ON event_logs(event_code);
CREATE INDEX idx_event_logs_event_type ON event_logs(event_type);

-- ESWF (Event Status Word Flag) Table
CREATE TABLE eswf_status (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    timestamp TIMESTAMP NOT NULL,
    esw_byte_15 SMALLINT DEFAULT 0,  -- Most significant byte
    esw_byte_14 SMALLINT DEFAULT 0,
    esw_byte_13 SMALLINT DEFAULT 0,
    esw_byte_12 SMALLINT DEFAULT 0,
    esw_byte_11 SMALLINT DEFAULT 0,
    esw_byte_10 SMALLINT DEFAULT 0,
    esw_byte_9 SMALLINT DEFAULT 0,
    esw_byte_8 SMALLINT DEFAULT 0,
    esw_byte_7 SMALLINT DEFAULT 0,
    esw_byte_6 SMALLINT DEFAULT 0,
    esw_byte_5 SMALLINT DEFAULT 0,
    esw_byte_4 SMALLINT DEFAULT 0,
    esw_byte_3 SMALLINT DEFAULT 0,
    esw_byte_2 SMALLINT DEFAULT 0,
    esw_byte_1 SMALLINT DEFAULT 0,
    esw_byte_0 SMALLINT DEFAULT 0,  -- Least significant byte
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eswf_status_timestamp ON eswf_status(timestamp);

-- ESWF Push Alarms Table
CREATE TABLE eswf_push_alarms (
    id SERIAL PRIMARY KEY,
    eswf_status_id INTEGER REFERENCES eswf_status(id),
    push_setup_id INTEGER REFERENCES push_setups(id),
    alarm_timestamp TIMESTAMP NOT NULL,
    alarm_type VARCHAR(50) NOT NULL,
    byte_position INTEGER NOT NULL,
    bit_position INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_retry_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_alarm_status CHECK (
        status IN ('PENDING', 'SENT', 'FAILED', 'ACKNOWLEDGED')
    )
);

CREATE INDEX idx_eswf_push_alarms_timestamp ON eswf_push_alarms(alarm_timestamp);
CREATE INDEX idx_eswf_push_alarms_status ON eswf_push_alarms(status);

SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_type, table_name; 