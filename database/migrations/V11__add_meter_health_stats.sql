-- Migration V11: Add meter health stats table
-- This table stores battery level, signal strength, and health status for meters

CREATE TABLE meter_health_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_serial_number VARCHAR(100) NOT NULL,
    capture_time TIMESTAMPTZ NOT NULL,
    battery_level INTEGER NOT NULL CHECK (battery_level >= 0 AND battery_level <= 100),
    signal_strength INTEGER NOT NULL CHECK (signal_strength >= 0 AND signal_strength <= 100),
    health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('GOOD', 'WARNING', 'CRITICAL')),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    communication_quality INTEGER CHECK (communication_quality >= 0 AND communication_quality <= 100),
    last_successful_communication TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_meter_health_stats_meter_time ON meter_health_stats(meter_serial_number, capture_time DESC);
CREATE INDEX idx_meter_health_stats_status ON meter_health_stats(health_status, capture_time DESC);
CREATE INDEX idx_meter_health_stats_battery ON meter_health_stats(battery_level, capture_time DESC);
CREATE INDEX idx_meter_health_stats_signal ON meter_health_stats(signal_strength, capture_time DESC);

-- Add foreign key constraint if meters table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meters') THEN
        ALTER TABLE meter_health_stats 
        ADD CONSTRAINT fk_meter_health_stats_meter 
        FOREIGN KEY (meter_serial_number) REFERENCES meters(serial_number) ON DELETE CASCADE;
    END IF;
END $$;

-- Create a view for current health status
CREATE OR REPLACE VIEW meter_current_health AS
SELECT DISTINCT ON (meter_serial_number)
    meter_serial_number,
    battery_level,
    signal_strength,
    health_status,
    temperature,
    humidity,
    communication_quality,
    last_successful_communication,
    capture_time
FROM meter_health_stats
ORDER BY meter_serial_number, capture_time DESC;

-- Add comment
COMMENT ON TABLE meter_health_stats IS 'Stores battery level, signal strength, and health status for meters';
COMMENT ON COLUMN meter_health_stats.battery_level IS 'Battery level percentage (0-100)';
COMMENT ON COLUMN meter_health_stats.signal_strength IS 'Signal strength percentage (0-100)';
COMMENT ON COLUMN meter_health_stats.health_status IS 'Overall health status: GOOD, WARNING, CRITICAL';
COMMENT ON COLUMN meter_health_stats.communication_quality IS 'Communication quality percentage (0-100)'; 