-- Test database connectivity and create sample meter data
\c hes_db;

-- Check if tables exist
\dt;

-- Insert a test meter if it doesn't exist
INSERT INTO meters (
    meter_serial_number,
    device_id,
    manufacturer_name,
    firmware_version,
    meter_type,
    meter_category,
    current_rating,
    year_of_manufacture,
    ctr,
    ptr,
    created_at,
    updated_at
) VALUES 
('SIM001', 'DEV001', 'HES Simulator', 'v1.0.0', 1, 'Residential', '10-60A', 2023, 1, 1, NOW(), NOW())
ON CONFLICT (meter_serial_number) DO NOTHING;

-- Insert some sample instantaneous readings
INSERT INTO instantaneous_profiles (
    meter_serial_number,
    capture_time,
    l1_current_ir,
    l2_current_iy,
    l3_current_ib,
    l1_voltage_vrn,
    l2_voltage_vyn,
    l3_voltage_vbn,
    active_power,
    reactive_power,
    frequency,
    created_at
) VALUES 
('SIM001', NOW(), 5.2, 5.1, 5.3, 230.5, 229.8, 231.2, 1200.5, 150.2, 50.1, NOW());

-- Check the data
SELECT COUNT(*) as meter_count FROM meters;
SELECT COUNT(*) as reading_count FROM instantaneous_profiles;

-- Show recent readings
SELECT meter_serial_number, capture_time, active_power, l1_voltage_vrn 
FROM instantaneous_profiles 
ORDER BY capture_time DESC 
LIMIT 5; 