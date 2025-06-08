-- Create audit table for meter readings
CREATE TABLE meter_readings_audit (
    audit_id SERIAL PRIMARY KEY,
    operation CHAR(1) NOT NULL,
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT,
    meter_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    old_value DOUBLE PRECISION,
    new_value DOUBLE PRECISION,
    old_quality INTEGER,
    new_quality INTEGER,
    old_validation_status VARCHAR(20),
    new_validation_status VARCHAR(20)
);

-- Create function for meter readings audit
CREATE OR REPLACE FUNCTION process_meter_readings_audit() RETURNS TRIGGER AS $meter_readings_audit$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO meter_readings_audit 
        (operation, meter_id, timestamp, reading_type, old_value, old_quality, old_validation_status)
        VALUES ('D', OLD.meter_id, OLD.timestamp, OLD.reading_type, OLD.value, OLD.quality, OLD.validation_status);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO meter_readings_audit 
        (operation, meter_id, timestamp, reading_type, 
         old_value, new_value, 
         old_quality, new_quality,
         old_validation_status, new_validation_status)
        VALUES ('U', NEW.meter_id, NEW.timestamp, NEW.reading_type,
                OLD.value, NEW.value,
                OLD.quality, NEW.quality,
                OLD.validation_status, NEW.validation_status);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO meter_readings_audit 
        (operation, meter_id, timestamp, reading_type, new_value, new_quality, new_validation_status)
        VALUES ('I', NEW.meter_id, NEW.timestamp, NEW.reading_type, NEW.value, NEW.quality, NEW.validation_status);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$meter_readings_audit$ LANGUAGE plpgsql;

-- Create trigger for meter readings audit
CREATE TRIGGER meter_readings_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON meter_readings
    FOR EACH ROW EXECUTE FUNCTION process_meter_readings_audit();

-- Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add modified timestamp trigger to all measurement tables
CREATE TRIGGER update_meter_readings_timestamp
    BEFORE UPDATE ON meter_readings
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_power_readings_timestamp
    BEFORE UPDATE ON power_readings
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_energy_measurements_timestamp
    BEFORE UPDATE ON energy_measurements
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_voltage_measurements_timestamp
    BEFORE UPDATE ON voltage_measurements
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_current_measurements_timestamp
    BEFORE UPDATE ON current_measurements
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_daily_load_profile_timestamp
    BEFORE UPDATE ON daily_load_profile
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_block_load_profile_timestamp
    BEFORE UPDATE ON block_load_profile
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_billing_profile_timestamp
    BEFORE UPDATE ON billing_profile
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_instant_profile_timestamp
    BEFORE UPDATE ON instant_profile
    FOR EACH ROW EXECUTE FUNCTION update_modified_timestamp();

-- Create function for validation status updates
CREATE OR REPLACE FUNCTION check_and_update_validation_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If quality is less than 192 (not perfect quality), mark as requiring validation
    IF NEW.quality < 192 THEN
        NEW.validation_status = 'UNVALIDATED';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add validation status trigger to meter readings
CREATE TRIGGER check_meter_readings_validation
    BEFORE INSERT OR UPDATE ON meter_readings
    FOR EACH ROW EXECUTE FUNCTION check_and_update_validation_status();

-- Add validation status triggers to other measurement tables
CREATE TRIGGER check_power_readings_validation
    BEFORE INSERT OR UPDATE ON power_readings
    FOR EACH ROW EXECUTE FUNCTION check_and_update_validation_status();

CREATE TRIGGER check_energy_measurements_validation
    BEFORE INSERT OR UPDATE ON energy_measurements
    FOR EACH ROW EXECUTE FUNCTION check_and_update_validation_status();

CREATE TRIGGER check_voltage_measurements_validation
    BEFORE INSERT OR UPDATE ON voltage_measurements
    FOR EACH ROW EXECUTE FUNCTION check_and_update_validation_status();

CREATE TRIGGER check_current_measurements_validation
    BEFORE INSERT OR UPDATE ON current_measurements
    FOR EACH ROW EXECUTE FUNCTION check_and_update_validation_status();

COMMENT ON TABLE meter_readings_audit IS 'Audit table for tracking changes to meter readings';
COMMENT ON FUNCTION process_meter_readings_audit() IS 'Function to handle audit logging for meter readings';
COMMENT ON FUNCTION update_modified_timestamp() IS 'Function to automatically update modification timestamps';
COMMENT ON FUNCTION check_and_update_validation_status() IS 'Function to automatically update validation status based on quality'; 