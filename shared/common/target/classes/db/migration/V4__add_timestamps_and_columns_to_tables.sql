-- Billing Profile Table Enhancements
ALTER TABLE billing_profile
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN retry_count INTEGER DEFAULT 0,
    ADD COLUMN source VARCHAR(20) DEFAULT 'NORMAL_READ',
    ADD COLUMN meter_program_id VARCHAR(50),
    ADD COLUMN billing_cycle_id VARCHAR(50),
    ADD COLUMN billing_status VARCHAR(20) DEFAULT 'PENDING';

-- Block Load Profile Table Enhancements
ALTER TABLE block_load_profile
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN capture_period INTEGER,
    ADD COLUMN source VARCHAR(20) DEFAULT 'NORMAL_READ',
    ADD COLUMN load_profile_status VARCHAR(20) DEFAULT 'ACTIVE';

-- Current Measurements Table Enhancements
ALTER TABLE current_measurements
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN phase VARCHAR(10),
    ADD COLUMN quality_code INTEGER DEFAULT 192,
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN measurement_type VARCHAR(20);

-- Daily Load Profile Table Enhancements
ALTER TABLE daily_load_profile
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN profile_status VARCHAR(20) DEFAULT 'ACTIVE',
    ADD COLUMN interval_minutes INTEGER,
    ADD COLUMN missing_intervals INTEGER DEFAULT 0;

-- Energy Measurements Table Enhancements
ALTER TABLE energy_measurements
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN measurement_type VARCHAR(20),
    ADD COLUMN quality_code INTEGER DEFAULT 192,
    ADD COLUMN scaling_factor INTEGER;

-- Event Logs Table Enhancements
ALTER TABLE event_logs
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN priority INTEGER DEFAULT 3,
    ADD COLUMN acknowledgment_status VARCHAR(20) DEFAULT 'UNACKNOWLEDGED',
    ADD COLUMN acknowledged_by UUID,
    ADD COLUMN acknowledged_at TIMESTAMPTZ,
    ADD COLUMN resolution_status VARCHAR(20) DEFAULT 'OPEN',
    ADD COLUMN resolution_notes TEXT;

-- Instant Profile Table Enhancements
ALTER TABLE instant_profile
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN profile_type VARCHAR(20),
    ADD COLUMN quality_code INTEGER DEFAULT 192;

-- Power Readings Table Enhancements
ALTER TABLE power_readings
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN power_type VARCHAR(20),
    ADD COLUMN power_factor DECIMAL(5,3),
    ADD COLUMN quality_code INTEGER DEFAULT 192;

-- Voltage Measurements Table Enhancements
ALTER TABLE voltage_measurements
    ADD COLUMN hes_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN rtc_timestamp TIMESTAMPTZ,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN phase VARCHAR(10),
    ADD COLUMN quality_code INTEGER DEFAULT 192,
    ADD COLUMN nominal_voltage INTEGER;

-- Add constraints for validation status
ALTER TABLE billing_profile 
    ADD CONSTRAINT valid_billing_validation_status 
    CHECK (validation_status IN ('UNVALIDATED', 'VALID', 'INVALID', 'ESTIMATED', 'MANUALLY_VALIDATED'));

ALTER TABLE block_load_profile 
    ADD CONSTRAINT valid_block_validation_status 
    CHECK (validation_status IN ('UNVALIDATED', 'VALID', 'INVALID', 'ESTIMATED', 'MANUALLY_VALIDATED'));

-- Add indexes for commonly queried columns
CREATE INDEX idx_billing_hes_timestamp ON billing_profile(hes_timestamp DESC);
CREATE INDEX idx_block_load_hes_timestamp ON block_load_profile(hes_timestamp DESC);
CREATE INDEX idx_current_hes_timestamp ON current_measurements(hes_timestamp DESC);
CREATE INDEX idx_daily_load_hes_timestamp ON daily_load_profile(hes_timestamp DESC);
CREATE INDEX idx_energy_hes_timestamp ON energy_measurements(hes_timestamp DESC);
CREATE INDEX idx_events_hes_timestamp ON event_logs(hes_timestamp DESC);
CREATE INDEX idx_instant_hes_timestamp ON instant_profile(hes_timestamp DESC);
CREATE INDEX idx_power_hes_timestamp ON power_readings(hes_timestamp DESC);
CREATE INDEX idx_voltage_hes_timestamp ON voltage_measurements(hes_timestamp DESC);

-- Add indexes for validation status
CREATE INDEX idx_billing_validation ON billing_profile(validation_status);
CREATE INDEX idx_block_validation ON block_load_profile(validation_status);
CREATE INDEX idx_current_validation ON current_measurements(validation_status);
CREATE INDEX idx_daily_validation ON daily_load_profile(validation_status);
CREATE INDEX idx_energy_validation ON energy_measurements(validation_status);
CREATE INDEX idx_instant_validation ON instant_profile(validation_status);
CREATE INDEX idx_power_validation ON power_readings(validation_status);
CREATE INDEX idx_voltage_validation ON voltage_measurements(validation_status); 