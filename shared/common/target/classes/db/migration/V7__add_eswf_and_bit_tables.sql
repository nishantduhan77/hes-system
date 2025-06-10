-- Event Status Word Flag (ESWF) table
CREATE TABLE eswf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    timestamp TIMESTAMPTZ NOT NULL,
    rtc_timestamp TIMESTAMPTZ,
    power_fail BOOLEAN DEFAULT false,
    power_up BOOLEAN DEFAULT false,
    voltage_unbalance BOOLEAN DEFAULT false,
    current_unbalance BOOLEAN DEFAULT false,
    overvoltage BOOLEAN DEFAULT false,
    undervoltage BOOLEAN DEFAULT false,
    overcurrent BOOLEAN DEFAULT false,
    power_factor_low BOOLEAN DEFAULT false,
    frequency_low BOOLEAN DEFAULT false,
    frequency_high BOOLEAN DEFAULT false,
    tamper_detected BOOLEAN DEFAULT false,
    memory_error BOOLEAN DEFAULT false,
    battery_low BOOLEAN DEFAULT false,
    rtc_error BOOLEAN DEFAULT false,
    display_error BOOLEAN DEFAULT false,
    program_memory_error BOOLEAN DEFAULT false,
    measurement_error BOOLEAN DEFAULT false,
    watchdog_error BOOLEAN DEFAULT false,
    communication_error BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Convert ESWF to hypertable
SELECT create_hypertable(
    'eswf',
    'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for ESWF
CREATE INDEX idx_eswf_meter_timestamp ON eswf(meter_id, timestamp DESC);
CREATE INDEX idx_eswf_power_events ON eswf(meter_id, timestamp DESC) WHERE power_fail = true OR power_up = true;
CREATE INDEX idx_eswf_tamper_events ON eswf(meter_id, timestamp DESC) WHERE tamper_detected = true;

-- Billing Information Table (BIT)
CREATE TABLE bit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(meter_id),
    billing_date TIMESTAMPTZ NOT NULL,
    rtc_timestamp TIMESTAMPTZ,
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    active_energy_import DOUBLE PRECISION,
    active_energy_export DOUBLE PRECISION,
    reactive_energy_import DOUBLE PRECISION,
    reactive_energy_export DOUBLE PRECISION,
    apparent_energy DOUBLE PRECISION,
    maximum_demand DOUBLE PRECISION,
    maximum_demand_timestamp TIMESTAMPTZ,
    power_factor DOUBLE PRECISION,
    billing_power_factor DOUBLE PRECISION,
    billing_demand DOUBLE PRECISION,
    cumulative_billing_demand DOUBLE PRECISION,
    cumulative_billing_count INTEGER,
    billing_reset_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Convert BIT to hypertable
SELECT create_hypertable(
    'bit',
    'billing_date',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

-- Create indexes for BIT
CREATE INDEX idx_bit_meter_date ON bit(meter_id, billing_date DESC);
CREATE INDEX idx_bit_period ON bit(billing_period_start, billing_period_end);

-- Add triggers for updated_at
CREATE TRIGGER update_eswf_updated_at
    BEFORE UPDATE ON eswf
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bit_updated_at
    BEFORE UPDATE ON bit
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at(); 