-- Add columns first
ALTER TABLE meter_readings 
    ADD COLUMN source VARCHAR(20) DEFAULT 'NORMAL_READ',
    ADD COLUMN capture_period INTEGER,
    ADD COLUMN validation_status VARCHAR(20) DEFAULT 'UNVALIDATED',
    ADD COLUMN validation_flags INTEGER[],
    ADD COLUMN communication_status VARCHAR(20),
    ADD COLUMN retry_count INTEGER DEFAULT 0,
    ADD COLUMN original_value DOUBLE PRECISION,
    ADD COLUMN scaling_factor INTEGER,
    ADD COLUMN meter_program_id VARCHAR(50),
    ADD COLUMN channel_id VARCHAR(20);

-- Add constraints separately
ALTER TABLE meter_readings 
    ADD CONSTRAINT valid_source 
    CHECK (source IN ('NORMAL_READ', 'AUTO_READ', 'MANUAL_READ', 'ESTIMATED', 'CALCULATED'));

ALTER TABLE meter_readings 
    ADD CONSTRAINT valid_validation_status 
    CHECK (validation_status IN ('UNVALIDATED', 'VALID', 'INVALID', 'ESTIMATED', 'MANUALLY_VALIDATED'));

ALTER TABLE meter_readings 
    ADD CONSTRAINT valid_communication_status 
    CHECK (communication_status IN ('SUCCESS', 'TIMEOUT', 'ERROR', 'PARTIAL'));

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_readings_source ON meter_readings(source);
CREATE INDEX IF NOT EXISTS idx_readings_validation_status ON meter_readings(validation_status);
CREATE INDEX IF NOT EXISTS idx_readings_communication_status ON meter_readings(communication_status);

-- Add column comments
COMMENT ON COLUMN meter_readings.source IS 'Source of the reading (NORMAL_READ, AUTO_READ, MANUAL_READ, ESTIMATED, CALCULATED)';
COMMENT ON COLUMN meter_readings.capture_period IS 'Time period in minutes for which this reading was captured';
COMMENT ON COLUMN meter_readings.validation_status IS 'Status of data validation (UNVALIDATED, VALID, INVALID, ESTIMATED, MANUALLY_VALIDATED)';
COMMENT ON COLUMN meter_readings.validation_flags IS 'Array of validation flag codes indicating specific validation issues';
COMMENT ON COLUMN meter_readings.communication_status IS 'Status of the communication when reading was obtained';
COMMENT ON COLUMN meter_readings.retry_count IS 'Number of retries needed to get this reading';
COMMENT ON COLUMN meter_readings.original_value IS 'Original value before any scaling or adjustments';
COMMENT ON COLUMN meter_readings.scaling_factor IS 'Scaling factor applied to the original value';
COMMENT ON COLUMN meter_readings.meter_program_id IS 'ID of the meter reading program/schedule that collected this reading';
COMMENT ON COLUMN meter_readings.channel_id IS 'Channel/Register ID from which the reading was collected'; 