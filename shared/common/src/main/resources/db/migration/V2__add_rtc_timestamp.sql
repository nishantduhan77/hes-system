-- Add RTC timestamp and rename existing timestamp to hes_timestamp
ALTER TABLE meter_readings 
    RENAME COLUMN timestamp TO hes_timestamp;

ALTER TABLE meter_readings 
    ADD COLUMN rtc_timestamp TIMESTAMPTZ;

-- Update existing records to copy hes_timestamp to rtc_timestamp
UPDATE meter_readings 
SET rtc_timestamp = hes_timestamp 
WHERE rtc_timestamp IS NULL;

-- Create index for the new column
CREATE INDEX idx_readings_rtc_timestamp ON meter_readings(rtc_timestamp DESC);

-- Update the continuous aggregate view to include both timestamps
DROP MATERIALIZED VIEW IF EXISTS meter_readings_hourly;

CREATE MATERIALIZED VIEW meter_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    meter_id,
    time_bucket('1 hour', hes_timestamp) AS hes_bucket,
    time_bucket('1 hour', rtc_timestamp) AS rtc_bucket,
    reading_type,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as reading_count
FROM meter_readings
GROUP BY meter_id, time_bucket('1 hour', hes_timestamp), time_bucket('1 hour', rtc_timestamp), reading_type; 