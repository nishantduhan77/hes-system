-- PostgreSQL/TimescaleDB version
CREATE TABLE IF NOT EXISTS meter_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    quality_code INTEGER,
    unit VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meter_id, timestamp, reading_type)
);

-- Convert to hypertable
SELECT create_hypertable('meter_readings', 'timestamp');

-- Create index for faster queries
CREATE INDEX idx_meter_readings_meter_id ON meter_readings (meter_id);
CREATE INDEX idx_meter_readings_reading_type ON meter_readings (reading_type);

-- Oracle version
CREATE SEQUENCE meter_reading_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE meter_readings (
    id NUMBER DEFAULT meter_reading_seq.NEXTVAL PRIMARY KEY,
    meter_id VARCHAR2(36) NOT NULL,
    reading_timestamp TIMESTAMP NOT NULL,
    reading_type VARCHAR2(50) NOT NULL,
    reading_value NUMBER NOT NULL,
    quality_code NUMBER,
    unit VARCHAR2(20),
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Create indexes
CREATE INDEX idx_meter_readings_meter_id ON meter_readings (meter_id);
CREATE INDEX idx_meter_readings_timestamp ON meter_readings (reading_timestamp);
CREATE INDEX idx_meter_readings_type ON meter_readings (reading_type);

-- Create unique constraint
ALTER TABLE meter_readings ADD CONSTRAINT uk_meter_reading 
    UNIQUE (meter_id, reading_timestamp, reading_type);

-- Sample queries for both databases:

-- Get latest readings for each meter
-- PostgreSQL:
SELECT DISTINCT ON (meter_id) *
FROM meter_readings
ORDER BY meter_id, timestamp DESC;

-- Oracle:
SELECT * FROM (
    SELECT m.*, 
           ROW_NUMBER() OVER (PARTITION BY meter_id ORDER BY reading_timestamp DESC) rn
    FROM meter_readings m
)
WHERE rn = 1;

-- Get hourly averages
-- PostgreSQL/TimescaleDB:
SELECT time_bucket('1 hour', timestamp) AS hour,
       avg(value) as avg_value,
       count(*) as reading_count
FROM meter_readings
GROUP BY hour
ORDER BY hour DESC;

-- Oracle:
SELECT 
    TRUNC(reading_timestamp, 'HH') as hour,
    AVG(reading_value) as avg_value,
    COUNT(*) as reading_count
FROM meter_readings
GROUP BY TRUNC(reading_timestamp, 'HH')
ORDER BY hour DESC; 