-- Create user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'hes_user') THEN
    CREATE USER hes_user WITH PASSWORD 'hes_password';
  END IF;
END
$$;

-- Grant privileges to hes_user
ALTER USER hes_user WITH SUPERUSER;

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create Meter Groups table
CREATE TABLE IF NOT EXISTS meter_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_meter_groups_name UNIQUE (name)
);

-- Create Meters table
CREATE TABLE IF NOT EXISTS meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    firmware_version VARCHAR(50),
    protocol_version VARCHAR(50),
    ip_address INET,
    port INTEGER,
    group_id UUID REFERENCES meter_groups(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    last_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_meters_serial_number UNIQUE (serial_number)
);

-- Create indexes for meters
CREATE INDEX IF NOT EXISTS idx_meters_group_id ON meters(group_id);
CREATE INDEX IF NOT EXISTS idx_meters_status ON meters(status);
CREATE INDEX IF NOT EXISTS idx_meters_last_connected_at ON meters(last_connected_at);

-- Create Meter readings table
CREATE TABLE IF NOT EXISTS meter_readings (
    meter_id UUID NOT NULL REFERENCES meters(id),
    timestamp TIMESTAMPTZ NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    quality INTEGER NOT NULL DEFAULT 192,
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meter_id, timestamp, reading_type)
);

-- Convert to hypertable
SELECT create_hypertable('meter_readings', 'timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for meter readings
CREATE INDEX IF NOT EXISTS idx_readings_meter_timestamp ON meter_readings(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_readings_type_timestamp ON meter_readings(reading_type, timestamp DESC);

-- Create Meter events table
CREATE TABLE IF NOT EXISTS meter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id UUID NOT NULL REFERENCES meters(id),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_meter_timestamp ON meter_events(meter_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_severity ON meter_events(event_type, severity);

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
);

-- Insert some initial data
INSERT INTO meter_groups (name, description) VALUES
('Default', 'Default meter group') ON CONFLICT DO NOTHING;

-- Create a default admin user (password: admin123)
INSERT INTO users (username, password_hash, email, role) VALUES
('admin', '$2b$10$1234567890123456789012345678901234567890', 'admin@example.com', 'ADMIN')
ON CONFLICT DO NOTHING;

-- Grant all privileges on all tables to hes_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hes_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hes_user; 