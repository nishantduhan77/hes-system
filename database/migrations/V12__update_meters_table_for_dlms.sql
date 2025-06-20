-- Migration to update meters table for DLMS/COSEM functionality
-- Add missing columns to match the JPA entity structure

-- First, rename the primary key column to match JPA entity
ALTER TABLE meters RENAME COLUMN id TO meter_id;

-- Add missing columns for DLMS/COSEM functionality
ALTER TABLE meters ADD COLUMN IF NOT EXISTS device_id VARCHAR(50);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS meter_type VARCHAR(50);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS meter_category VARCHAR(50);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS current_rating INTEGER;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS year_of_manufacture INTEGER;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS ctr DOUBLE PRECISION;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS ptr DOUBLE PRECISION;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS last_communication TIMESTAMPTZ;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS last_ping TIMESTAMPTZ;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS last_relay_operation TIMESTAMPTZ;

-- DLMS/COSEM specific columns
ALTER TABLE meters ADD COLUMN IF NOT EXISTS authentication_key VARCHAR(255);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS encryption_key VARCHAR(255);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS system_title VARCHAR(255);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS use_high_level_security BOOLEAN DEFAULT false;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS client_id INTEGER DEFAULT 1;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS server_lower_mac_address INTEGER DEFAULT 1;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS server_upper_mac_address INTEGER DEFAULT 0;

-- Additional metadata columns
ALTER TABLE meters ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS meter_group VARCHAR(100);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS installation_date VARCHAR(50);
ALTER TABLE meters ADD COLUMN IF NOT EXISTS notes TEXT;

-- Rename serial_number to meter_serial_number to match JPA entity
ALTER TABLE meters RENAME COLUMN serial_number TO meter_serial_number;

-- Update the primary key constraint
ALTER TABLE meters DROP CONSTRAINT IF EXISTS meters_pkey;
ALTER TABLE meters ADD PRIMARY KEY (meter_serial_number);

-- Update the unique constraint
ALTER TABLE meters DROP CONSTRAINT IF EXISTS uk_meters_serial_number;
ALTER TABLE meters ADD CONSTRAINT uk_meters_serial_number UNIQUE (meter_serial_number);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_meters_device_id ON meters(device_id);
CREATE INDEX IF NOT EXISTS idx_meters_is_active ON meters(is_active);
CREATE INDEX IF NOT EXISTS idx_meters_last_communication ON meters(last_communication);
CREATE INDEX IF NOT EXISTS idx_meters_customer_id ON meters(customer_id);
CREATE INDEX IF NOT EXISTS idx_meters_meter_group ON meters(meter_group);

-- Update existing data to set default values
UPDATE meters SET 
    device_id = meter_serial_number,
    meter_type = 'ELECTRONIC',
    meter_category = 'SINGLE_PHASE',
    current_rating = 100,
    year_of_manufacture = 2024,
    ctr = 1.0,
    ptr = 1.0,
    is_active = true,
    meter_group = 'Default'
WHERE device_id IS NULL;

-- Update foreign key references in other tables
-- Update meter_readings table to reference the new primary key
ALTER TABLE meter_readings DROP CONSTRAINT IF EXISTS meter_readings_meter_id_fkey;
ALTER TABLE meter_readings ADD CONSTRAINT meter_readings_meter_id_fkey 
    FOREIGN KEY (meter_id) REFERENCES meters(meter_serial_number);

-- Update meter_events table to reference the new primary key
ALTER TABLE meter_events DROP CONSTRAINT IF EXISTS meter_events_meter_id_fkey;
ALTER TABLE meter_events ADD CONSTRAINT meter_events_meter_id_fkey 
    FOREIGN KEY (meter_id) REFERENCES meters(meter_serial_number);

-- Update event_logs table to reference the new primary key
ALTER TABLE event_logs DROP CONSTRAINT IF EXISTS event_logs_meter_id_fkey;
ALTER TABLE event_logs ADD CONSTRAINT event_logs_meter_id_fkey 
    FOREIGN KEY (meter_id) REFERENCES meters(meter_serial_number);

-- Update instantaneous_profiles table to reference the new primary key
ALTER TABLE instantaneous_profiles DROP CONSTRAINT IF EXISTS instantaneous_profiles_meter_id_fkey;
ALTER TABLE instantaneous_profiles ADD CONSTRAINT instantaneous_profiles_meter_id_fkey 
    FOREIGN KEY (meter_id) REFERENCES meters(meter_serial_number);

-- Update block_load_profiles table to reference the new primary key
ALTER TABLE block_load_profiles DROP CONSTRAINT IF EXISTS block_load_profiles_meter_id_fkey;
ALTER TABLE block_load_profiles ADD CONSTRAINT block_load_profiles_meter_id_fkey 
    FOREIGN KEY (meter_id) REFERENCES meters(meter_serial_number);

-- Update daily_load_profiles table to reference the new primary key
ALTER TABLE daily_load_profiles DROP CONSTRAINT IF EXISTS daily_load_profiles_meter_id_fkey;
ALTER TABLE daily_load_profiles ADD CONSTRAINT daily_load_profiles_meter_id_fkey 
    FOREIGN KEY (meter_id) REFERENCES meters(meter_serial_number);

-- Update billing_profiles table to reference the new primary key
ALTER TABLE billing_profiles DROP CONSTRAINT IF EXISTS billing_profiles_meter_id_fkey;
ALTER TABLE billing_profiles ADD CONSTRAINT billing_profiles_meter_id_fkey 
    FOREIGN KEY (meter_id) REFERENCES meters(meter_serial_number);

-- Update profile_status table to reference the new primary key
ALTER TABLE profile_status DROP CONSTRAINT IF EXISTS profile_status_meter_id_fkey;
ALTER TABLE profile_status ADD CONSTRAINT profile_status_meter_id_fkey 
    FOREIGN KEY (meter_id) REFERENCES meters(meter_serial_number); 