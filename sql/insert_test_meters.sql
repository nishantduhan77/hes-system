-- Insert test meters
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
    ptr
) VALUES 
('TEST001', 'DEV001', 'Test Manufacturer', 'v1.0.0', 1, 'Residential', '10-60A', 2023, 1, 1),
('TEST002', 'DEV002', 'Test Manufacturer', 'v1.0.0', 1, 'Commercial', '20-100A', 2023, 1, 1),
('TEST003', 'DEV003', 'Test Manufacturer', 'v1.0.0', 1, 'Industrial', '30-200A', 2023, 1, 1);

-- Insert OBIS codes for common measurements
INSERT INTO obis_codes (obis_code, description, data_type, unit) VALUES
('1.0.1.8.0.255', 'Active Energy Import', 'FLOAT', 'Wh'),
('1.0.2.8.0.255', 'Active Energy Export', 'FLOAT', 'Wh'),
('1.0.32.7.0.255', 'Voltage L1', 'FLOAT', 'V'),
('1.0.52.7.0.255', 'Voltage L2', 'FLOAT', 'V'),
('1.0.72.7.0.255', 'Voltage L3', 'FLOAT', 'V'),
('1.0.31.7.0.255', 'Current L1', 'FLOAT', 'A'),
('1.0.51.7.0.255', 'Current L2', 'FLOAT', 'A'),
('1.0.71.7.0.255', 'Current L3', 'FLOAT', 'A'),
('1.0.13.7.0.255', 'Power Factor', 'FLOAT', ''),
('1.0.14.7.0.255', 'Frequency', 'FLOAT', 'Hz'); 