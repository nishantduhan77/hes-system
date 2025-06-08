-- Database Creation
CREATE DATABASE hes_db;

-- Connect to the database
\c hes_db;

-- Create Meters Table
CREATE TABLE meters (
    meter_id SERIAL PRIMARY KEY,
    meter_code VARCHAR(10) NOT NULL UNIQUE,
    serial_number VARCHAR(10) NOT NULL UNIQUE,
    manufacturer VARCHAR(50) DEFAULT 'Generic',
    model VARCHAR(50) DEFAULT 'Smart Meter v1',
    location VARCHAR(50) NOT NULL,
    installation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reading_timestamp TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Create Meter Readings Table
CREATE TABLE meter_readings (
    reading_id SERIAL PRIMARY KEY,
    meter_id INTEGER REFERENCES meters(meter_id),
    reading_timestamp TIMESTAMP NOT NULL,
    active_power_import NUMERIC(10,2),  -- in Watts
    active_power_export NUMERIC(10,2),  -- in Watts
    voltage_r_phase NUMERIC(5,2),       -- in Volts
    current_r_phase NUMERIC(5,2),       -- in Amperes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_readings_timestamp ON meter_readings(reading_timestamp);
CREATE INDEX idx_readings_meter_id ON meter_readings(meter_id);
CREATE INDEX idx_readings_meter_timestamp ON meter_readings(meter_id, reading_timestamp);

-- Basic Queries

-- 1. Get 15-minute blocks with averages
WITH blocks AS (
    SELECT 
        meter_id,
        date_trunc('hour', reading_timestamp) + 
        INTERVAL '15 min' * (date_part('minute', reading_timestamp)::integer / 15) as block_start,
        date_trunc('hour', reading_timestamp) + 
        INTERVAL '15 min' * (date_part('minute', reading_timestamp)::integer / 15) + 
        INTERVAL '15 min' as block_end,
        ROUND(AVG(active_power_import)::numeric, 2) as avg_import_power,
        ROUND(AVG(active_power_export)::numeric, 2) as avg_export_power,
        ROUND(AVG(voltage_r_phase)::numeric, 2) as avg_voltage,
        ROUND(AVG(current_r_phase)::numeric, 2) as avg_current,
        COUNT(*) as readings_count
    FROM meter_readings
    GROUP BY 
        meter_id,
        date_trunc('hour', reading_timestamp) + 
        INTERVAL '15 min' * (date_part('minute', reading_timestamp)::integer / 15)
)
SELECT 
    m.meter_code,
    m.location,
    to_char(b.block_start, 'YYYY-MM-DD HH24:MI') as block_start,
    to_char(b.block_end, 'YYYY-MM-DD HH24:MI') as block_end,
    b.avg_import_power,
    b.avg_export_power,
    b.avg_voltage,
    b.avg_current,
    b.readings_count
FROM blocks b
JOIN meters m ON m.meter_id = b.meter_id
ORDER BY b.block_start, m.meter_code;

-- 2. Get summary statistics
SELECT 
    COUNT(DISTINCT meter_id) as total_meters,
    COUNT(DISTINCT (
        date_trunc('hour', reading_timestamp) + 
        INTERVAL '15 min' * (date_part('minute', reading_timestamp)::integer / 15)
    )) as total_blocks,
    ROUND(AVG(active_power_import)::numeric, 2) as overall_avg_import,
    ROUND(MAX(active_power_import)::numeric, 2) as max_import,
    ROUND(MIN(active_power_import)::numeric, 2) as min_import
FROM meter_readings;

-- 3. Get location-wise consumption
SELECT 
    m.location,
    COUNT(DISTINCT m.meter_id) as meter_count,
    ROUND(AVG(mr.active_power_import)::numeric, 2) as avg_consumption,
    ROUND(MAX(mr.active_power_import)::numeric, 2) as peak_consumption
FROM meters m
JOIN meter_readings mr ON m.meter_id = mr.meter_id
GROUP BY m.location
ORDER BY avg_consumption DESC;

-- 4. Get hourly consumption patterns
SELECT 
    EXTRACT(HOUR FROM reading_timestamp) as hour_of_day,
    ROUND(AVG(active_power_import)::numeric, 2) as avg_consumption,
    COUNT(*) as reading_count
FROM meter_readings
GROUP BY hour_of_day
ORDER BY hour_of_day;

-- 5. Get meters with highest export (generation)
SELECT 
    m.meter_code,
    m.location,
    ROUND(AVG(mr.active_power_export)::numeric, 2) as avg_export,
    ROUND(MAX(mr.active_power_export)::numeric, 2) as max_export
FROM meters m
JOIN meter_readings mr ON m.meter_id = mr.meter_id
GROUP BY m.meter_code, m.location
ORDER BY avg_export DESC;

-- 6. Get voltage stability analysis
SELECT 
    m.meter_code,
    m.location,
    ROUND(AVG(mr.voltage_r_phase)::numeric, 2) as avg_voltage,
    ROUND(MIN(mr.voltage_r_phase)::numeric, 2) as min_voltage,
    ROUND(MAX(mr.voltage_r_phase)::numeric, 2) as max_voltage,
    ROUND(STDDEV(mr.voltage_r_phase)::numeric, 4) as voltage_stddev
FROM meters m
JOIN meter_readings mr ON m.meter_id = mr.meter_id
GROUP BY m.meter_code, m.location
ORDER BY voltage_stddev DESC;

-- 7. Get reading frequency per meter
SELECT 
    m.meter_code,
    COUNT(*) as total_readings,
    MIN(reading_timestamp) as first_reading,
    MAX(reading_timestamp) as last_reading,
    ROUND(
        EXTRACT(EPOCH FROM (MAX(reading_timestamp) - MIN(reading_timestamp))) / 
        COUNT(*)::numeric, 
        2
    ) as avg_seconds_between_readings
FROM meters m
JOIN meter_readings mr ON m.meter_id = mr.meter_id
GROUP BY m.meter_code
ORDER BY m.meter_code;

-- 8. Get power factor estimation (based on active power and apparent power)
SELECT 
    m.meter_code,
    m.location,
    ROUND(AVG(mr.active_power_import / (mr.voltage_r_phase * mr.current_r_phase))::numeric, 3) as avg_power_factor
FROM meters m
JOIN meter_readings mr ON m.meter_id = mr.meter_id
WHERE mr.voltage_r_phase > 0 AND mr.current_r_phase > 0
GROUP BY m.meter_code, m.location
ORDER BY avg_power_factor DESC; 