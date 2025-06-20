-- Table for storing meter configurations
CREATE TABLE meter_configurations (
    meter_id VARCHAR(50) PRIMARY KEY,
    serial_number VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    firmware_version VARCHAR(20) NOT NULL,
    security_level INTEGER NOT NULL,
    authentication_type INTEGER NOT NULL,
    authentication_key BYTEA,
    encryption_key BYTEA,
    system_title BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing meter states
CREATE TABLE meter_states (
    meter_id VARCHAR(50) PRIMARY KEY REFERENCES meter_configurations(meter_id),
    is_connected BOOLEAN DEFAULT FALSE,
    last_communication TIMESTAMP WITH TIME ZONE,
    current_tariff INTEGER DEFAULT 1,
    current_load DECIMAL(10,2) DEFAULT 0,
    battery_level INTEGER DEFAULT 100,
    eswf_bits INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing events
CREATE TABLE meter_events (
    event_id SERIAL PRIMARY KEY,
    meter_id VARCHAR(50) REFERENCES meter_configurations(meter_id),
    event_type INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration INTEGER,
    details JSONB,
    eswf_bits INTEGER,
    is_pushed BOOLEAN DEFAULT FALSE,
    push_timestamp TIMESTAMP WITH TIME ZONE
);

-- Table for storing network statistics
CREATE TABLE network_stats (
    meter_id VARCHAR(50) PRIMARY KEY REFERENCES meter_configurations(meter_id),
    total_packets BIGINT DEFAULT 0,
    lost_packets BIGINT DEFAULT 0,
    average_latency DECIMAL(10,2) DEFAULT 0,
    current_bandwidth BIGINT DEFAULT 0,
    connection_status VARCHAR(20) DEFAULT 'disconnected',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing custom OBIS data
CREATE TABLE custom_obis_data (
    meter_id VARCHAR(50) REFERENCES meter_configurations(meter_id),
    obis_code VARCHAR(20),
    value JSONB,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (meter_id, obis_code)
);

-- Table for storing security logs
CREATE TABLE security_logs (
    log_id SERIAL PRIMARY KEY,
    meter_id VARCHAR(50) REFERENCES meter_configurations(meter_id),
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    success BOOLEAN DEFAULT TRUE
);

-- Table for storing firmware versions
CREATE TABLE firmware_versions (
    version_id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    release_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    file_path VARCHAR(255),
    checksum VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE
);

-- Table for storing firmware upgrade history
CREATE TABLE firmware_upgrades (
    upgrade_id SERIAL PRIMARY KEY,
    meter_id VARCHAR(50) REFERENCES meter_configurations(meter_id),
    version_id INTEGER REFERENCES firmware_versions(version_id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_meter_events_meter_id ON meter_events(meter_id);
CREATE INDEX idx_meter_events_timestamp ON meter_events(timestamp);
CREATE INDEX idx_custom_obis_data_meter_id ON custom_obis_data(meter_id);
CREATE INDEX idx_security_logs_meter_id ON security_logs(meter_id);
CREATE INDEX idx_firmware_upgrades_meter_id ON firmware_upgrades(meter_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_meter_configurations_updated_at
    BEFORE UPDATE ON meter_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meter_states_updated_at
    BEFORE UPDATE ON meter_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 