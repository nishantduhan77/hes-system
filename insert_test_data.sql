-- Insert test meter group
INSERT INTO meter_groups (name, description) 
VALUES ('Test Group', 'Test meter group');

-- Get the group ID
DO $$
DECLARE
    group_id UUID;
BEGIN
    SELECT id INTO group_id FROM meter_groups WHERE name = 'Test Group';

    -- Insert test meters
    INSERT INTO meters (
        meter_code, 
        serial_number, 
        manufacturer, 
        model, 
        meter_type, 
        location, 
        installation_date,
        group_id
    ) VALUES 
    ('METER001', 'SN001', 'ABB', 'A3', 'SMART_METER', 'Location 1', CURRENT_TIMESTAMP, group_id),
    ('METER002', 'SN002', 'Schneider', 'S5', 'SMART_METER', 'Location 2', CURRENT_TIMESTAMP, group_id),
    ('METER003', 'SN003', 'Siemens', 'SM3', 'SMART_METER', 'Location 3', CURRENT_TIMESTAMP, group_id);

    -- Insert some test readings
    INSERT INTO meter_readings (
        meter_id,
        timestamp,
        reading_type,
        value,
        unit,
        quality
    )
    SELECT 
        meter_id,
        CURRENT_TIMESTAMP,
        'ACTIVE_POWER_IMPORT',
        random() * 1000 + 500, -- Random value between 500 and 1500
        'kW',
        192
    FROM meters;

    -- Insert voltage readings
    INSERT INTO meter_readings (
        meter_id,
        timestamp,
        reading_type,
        value,
        unit,
        quality
    )
    SELECT 
        meter_id,
        CURRENT_TIMESTAMP,
        'VOLTAGE_L1',
        random() * 10 + 230, -- Random voltage around 230V
        'V',
        192
    FROM meters;
END $$; 