# DLMS/COSEM Smart Meter Simulator Database Schema

## Overview
This document details the database schema for the DLMS/COSEM smart meter simulator. The schema is designed to support all major functionalities of a smart meter including various load profiles, event logging, push operations, and ESWF (Event Status Word Flag) management.

## Core Tables

### OBIS Codes
```sql
CREATE TABLE obis_codes (
    id SERIAL PRIMARY KEY,
    logical_name VARCHAR(50) NOT NULL UNIQUE,
    class_id INTEGER NOT NULL,
    description TEXT
);
```
Central reference table for all OBIS codes used in the system.

### Push Setup and Scheduling

#### Push Setups (Class ID = 40)
```sql
CREATE TABLE push_setups (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    destination_and_method TEXT,
    communication_window JSONB,
    randomisation_start_interval INTEGER,
    number_of_retries INTEGER,
    repetition_delay INTEGER
);
```

#### Push Objects
```sql
CREATE TABLE push_objects (
    id SERIAL PRIMARY KEY,
    push_setup_id INTEGER REFERENCES push_setups(id),
    class_id INTEGER NOT NULL,
    logical_name VARCHAR(50) NOT NULL,
    attribute_index INTEGER NOT NULL,
    data_index INTEGER NOT NULL
);
```

#### Push Schedules
```sql
CREATE TABLE push_schedules (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    schedule_type VARCHAR(20) NOT NULL,
    is_enabled BOOLEAN DEFAULT true
);
```
Supports schedule types: FIFTEEN_MIN, THIRTY_MIN, ONE_HOUR, FOUR_HOUR, EIGHT_HOUR, TWELVE_HOUR, TWENTY_FOUR_HOUR

## Load Profile Tables

### Instantaneous Profile
```sql
CREATE TABLE instant_profile (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    timestamp TIMESTAMP NOT NULL,
    voltage_r DECIMAL(10,2),
    voltage_y DECIMAL(10,2),
    voltage_b DECIMAL(10,2),
    current_r DECIMAL(10,3),
    current_y DECIMAL(10,3),
    current_b DECIMAL(10,3),
    active_power_r DECIMAL(10,3),
    active_power_y DECIMAL(10,3),
    active_power_b DECIMAL(10,3),
    power_factor_r DECIMAL(5,3),
    power_factor_y DECIMAL(5,3),
    power_factor_b DECIMAL(5,3),
    frequency DECIMAL(5,2)
);
```
Captures real-time measurements for all phases.

### Block Load Profile
```sql
CREATE TABLE block_load_profile (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    capture_time TIMESTAMP NOT NULL,
    kWh_import DECIMAL(18,3),
    kWh_export DECIMAL(18,3),
    kVAh_import DECIMAL(18,3),
    kVAh_export DECIMAL(18,3),
    average_current_r DECIMAL(10,3),
    average_current_y DECIMAL(10,3),
    average_current_b DECIMAL(10,3),
    average_voltage_r DECIMAL(10,2),
    average_voltage_y DECIMAL(10,2),
    average_voltage_b DECIMAL(10,2),
    block_interval_minutes INTEGER,
    status_word VARCHAR(32)
);
```
Stores interval data typically collected every 15/30 minutes.

### Daily Load Profile
```sql
CREATE TABLE daily_load_profile (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    capture_date DATE NOT NULL,
    cumulative_kWh_import DECIMAL(18,3),
    cumulative_kWh_export DECIMAL(18,3),
    cumulative_kVAh_import DECIMAL(18,3),
    cumulative_kVAh_export DECIMAL(18,3),
    daily_kWh_import DECIMAL(18,3),
    daily_kWh_export DECIMAL(18,3),
    daily_kVAh_import DECIMAL(18,3),
    daily_kVAh_export DECIMAL(18,3),
    max_demand_kW DECIMAL(10,3),
    max_demand_time TIMESTAMP,
    power_factor DECIMAL(5,3)
);
```
Daily aggregated measurements and statistics.

### Billing Profile
```sql
CREATE TABLE billing_profile (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    billing_date DATE NOT NULL,
    reset_count INTEGER,
    cumulative_kWh_import DECIMAL(18,3),
    cumulative_kWh_export DECIMAL(18,3),
    cumulative_kVAh_import DECIMAL(18,3),
    cumulative_kVAh_export DECIMAL(18,3),
    monthly_kWh_import DECIMAL(18,3),
    monthly_kWh_export DECIMAL(18,3),
    monthly_kVAh_import DECIMAL(18,3),
    monthly_kVAh_export DECIMAL(18,3),
    max_demand_kW DECIMAL(10,3),
    max_demand_date TIMESTAMP,
    power_factor DECIMAL(5,3),
    billing_status_word VARCHAR(32)
);
```
Monthly billing cycle data and reset information.

## Event and Alarm Management

### Event Logs
```sql
CREATE TABLE event_logs (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    event_timestamp TIMESTAMP NOT NULL,
    event_code INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    additional_data JSONB,
    acknowledged BOOLEAN DEFAULT false
);
```
Supported event types:
- POWER_FAILURE
- VOLTAGE_RELATED
- CURRENT_RELATED
- POWER_QUALITY
- FIRMWARE
- COMMUNICATION
- ACCESS
- CONFIGURATION
- CLOCK
- BILLING

### ESWF Status
```sql
CREATE TABLE eswf_status (
    id SERIAL PRIMARY KEY,
    obis_code_id INTEGER REFERENCES obis_codes(id),
    timestamp TIMESTAMP NOT NULL,
    esw_byte_15 SMALLINT DEFAULT 0,  -- Most significant byte
    esw_byte_14 SMALLINT DEFAULT 0,
    esw_byte_13 SMALLINT DEFAULT 0,
    esw_byte_12 SMALLINT DEFAULT 0,
    esw_byte_11 SMALLINT DEFAULT 0,
    esw_byte_10 SMALLINT DEFAULT 0,
    esw_byte_9 SMALLINT DEFAULT 0,
    esw_byte_8 SMALLINT DEFAULT 0,
    esw_byte_7 SMALLINT DEFAULT 0,
    esw_byte_6 SMALLINT DEFAULT 0,
    esw_byte_5 SMALLINT DEFAULT 0,
    esw_byte_4 SMALLINT DEFAULT 0,
    esw_byte_3 SMALLINT DEFAULT 0,
    esw_byte_2 SMALLINT DEFAULT 0,
    esw_byte_1 SMALLINT DEFAULT 0,
    esw_byte_0 SMALLINT DEFAULT 0   -- Least significant byte
);
```
Implements the 16-byte ESWF structure for comprehensive event status tracking.

### ESWF Push Alarms
```sql
CREATE TABLE eswf_push_alarms (
    id SERIAL PRIMARY KEY,
    eswf_status_id INTEGER REFERENCES eswf_status(id),
    push_setup_id INTEGER REFERENCES push_setups(id),
    alarm_timestamp TIMESTAMP NOT NULL,
    alarm_type VARCHAR(50) NOT NULL,
    byte_position INTEGER NOT NULL,
    bit_position INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_retry_timestamp TIMESTAMP
);
```
Alarm statuses: PENDING, SENT, FAILED, ACKNOWLEDGED

## Database Views

### Active Schedules
```sql
CREATE VIEW active_schedules AS
SELECT 
    ps.id,
    ps.schedule_type,
    oc.logical_name,
    se.time_pattern,
    se.comment
FROM push_schedules ps
JOIN obis_codes oc ON ps.obis_code_id = oc.id
JOIN schedule_entries se ON se.schedule_id = ps.id
WHERE ps.is_enabled = true;
```

### Latest Measurements
```sql
CREATE VIEW latest_measurements AS
SELECT 
    oc.logical_name,
    em.value as energy_value,
    em.unit as energy_unit,
    vm.value as voltage_value,
    cm.value as current_value,
    COALESCE(em.timestamp, vm.timestamp, cm.timestamp) as measurement_time
FROM obis_codes oc
LEFT JOIN energy_measurements em ON em.obis_code_id = oc.id
LEFT JOIN voltage_measurements vm ON vm.obis_code_id = oc.id
LEFT JOIN current_measurements cm ON cm.obis_code_id = oc.id;
```

## Indexing Strategy
Each table includes appropriate indexes for:
- Timestamp columns
- Foreign key relationships
- Frequently queried columns
- Status fields

## Data Integrity
- All tables include created_at timestamps
- Foreign key constraints ensure referential integrity
- Check constraints validate enum-like fields
- Appropriate data types chosen for precision and storage efficiency 