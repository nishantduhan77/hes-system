-- Insert test meter groups
INSERT INTO meter_groups (id, name, description)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Residential Area 1', 'Residential meters in downtown area'),
    ('22222222-2222-2222-2222-222222222222', 'Industrial Zone A', 'Industrial meters in manufacturing district');

-- Insert test meters
INSERT INTO meters (
    meter_id,
    meter_code,
    serial_number,
    manufacturer,
    model,
    meter_type,
    location,
    firmware_version,
    installation_date,
    status,
    protocol_version,
    ip_address,
    port,
    group_id
)
VALUES 
    (
        '33333333-3333-3333-3333-333333333333',
        'METER001',
        'ABB001',
        'ABB',
        'A3',
        'SMART_METER',
        'Building A, Floor 1',
        '1.2.3',
        CURRENT_TIMESTAMP,
        'DISCONNECTED',
        'DLMS 1.0',
        '192.168.1.101',
        4059,
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'METER002',
        'SCH001',
        'Schneider',
        'S5',
        'SMART_METER',
        'Building B, Floor 2',
        '2.0.1',
        CURRENT_TIMESTAMP,
        'DISCONNECTED',
        'DLMS 1.0',
        '192.168.1.102',
        4059,
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'METER003',
        'SIE001',
        'Siemens',
        'SM3',
        'SMART_METER',
        'Factory 1, Main Hall',
        '3.1.0',
        CURRENT_TIMESTAMP,
        'DISCONNECTED',
        'DLMS 1.0',
        '192.168.1.103',
        4059,
        '22222222-2222-2222-2222-222222222222'
    ); 