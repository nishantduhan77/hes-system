-- Delete existing data
TRUNCATE meter_readings CASCADE;
TRUNCATE meters CASCADE;
TRUNCATE meter_groups CASCADE;

-- Insert test meter group
INSERT INTO meter_groups (name, description) 
VALUES ('Test Group', 'Test meter group')
RETURNING id INTO @group_id;

-- Insert test meters
INSERT INTO meters (
    meter_code, 
    serial_number, 
    manufacturer, 
    model, 
    meter_type, 
    location, 
    installation_date
) VALUES 
('METER001', 'SN001', 'ABB', 'A3', 'SMART_METER', 'Location 1', CURRENT_TIMESTAMP),
('METER002', 'SN002', 'Schneider', 'S5', 'SMART_METER', 'Location 2', CURRENT_TIMESTAMP),
('METER003', 'SN003', 'Siemens', 'SM3', 'SMART_METER', 'Location 3', CURRENT_TIMESTAMP); 