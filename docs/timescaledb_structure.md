# TimescaleDB Structure Documentation

## Overview
This document describes the structure, data flow, and trigger mechanisms in the HES (Head End System) TimescaleDB implementation.

## Table Structure

### Core Measurement Tables (Hypertables)

1. **meter_readings**
   - Primary time-series table for all meter readings
   - Columns:
     - meter_id (UUID)
     - timestamp (TIMESTAMPTZ)
     - reading_type (VARCHAR(50))
     - value (DOUBLE PRECISION)
     - quality (INTEGER)
     - unit (VARCHAR(20))
     - created_at (TIMESTAMPTZ)
     - source (VARCHAR(20))
     - capture_period (INTEGER)
     - validation_status (VARCHAR(20))
     - validation_flags (INTEGER[])
     - communication_status (VARCHAR(20))
     - retry_count (INTEGER)
     - original_value (DOUBLE PRECISION)
     - scaling_factor (INTEGER)
     - meter_program_id (VARCHAR(50))
     - channel_id (VARCHAR(20))

2. **power_readings**
   - Specific power measurement readings
   - Includes active, reactive, and apparent power
   - Similar structure to meter_readings

3. **energy_measurements**
   - Energy consumption measurements
   - Tracks cumulative and interval energy usage

4. **voltage_measurements**
   - Voltage-specific readings
   - Phase voltage measurements

5. **current_measurements**
   - Current-specific readings
   - Phase current measurements

6. **daily_load_profile**
   - Daily aggregated load measurements
   - 24-hour consumption patterns

7. **block_load_profile**
   - Block-wise load measurements
   - Time-block based consumption

8. **billing_profile**
   - Billing-related measurements
   - Revenue-grade meter data

9. **instant_profile**
   - Real-time instantaneous measurements
   - Current status readings

### Audit Tables

**meter_readings_audit**
- Tracks all changes to meter readings
- Columns:
  - audit_id (SERIAL)
  - operation (CHAR(1))
  - modified_at (TIMESTAMPTZ)
  - modified_by (TEXT)
  - meter_id (UUID)
  - timestamp (TIMESTAMPTZ)
  - reading_type (VARCHAR(50))
  - old_value (DOUBLE PRECISION)
  - new_value (DOUBLE PRECISION)
  - old_quality (INTEGER)
  - new_quality (INTEGER)
  - old_validation_status (VARCHAR(20))
  - new_validation_status (VARCHAR(20))

## Trigger System

### 1. Validation Triggers
- **Trigger Names**: check_*_validation
- **When**: BEFORE INSERT OR UPDATE
- **Tables Affected**: 
  - meter_readings
  - power_readings
  - energy_measurements
  - voltage_measurements
  - current_measurements
- **Function**: check_and_update_validation_status()
- **Purpose**: Automatically validates data quality
- **Logic**:
  ```sql
  IF quality < 192 THEN
      validation_status = 'UNVALIDATED'
  END IF
  ```

### 2. Timestamp Update Triggers
- **Trigger Names**: update_*_timestamp
- **When**: BEFORE UPDATE
- **Tables Affected**: All measurement tables
- **Function**: update_modified_timestamp()
- **Purpose**: Maintains modification timestamps
- **Logic**:
  ```sql
  NEW.created_at = CURRENT_TIMESTAMP
  ```

### 3. Audit Triggers
- **Trigger Name**: meter_readings_audit_trigger
- **When**: AFTER INSERT OR UPDATE OR DELETE
- **Tables Affected**: meter_readings
- **Function**: process_meter_readings_audit()
- **Purpose**: Maintains audit trail
- **Logic**:
  - INSERT: Records new values
  - UPDATE: Records old and new values
  - DELETE: Records deleted values

## Data Flow

### 1. Data Input Sources
- Smart Meter Devices
- HES Simulator
- Manual Input

### 2. Data Processing Flow
1. **Raw Data Reception**
   - Data arrives from input sources
   - Initial quality check
   - Timestamp assignment

2. **Data Validation**
   - Quality assessment (trigger-based)
   - Validation status assignment
   - Flag setting for quality issues

3. **Data Storage**
   - Storage in appropriate hypertable
   - Automatic timestamp update
   - Audit trail creation

4. **Data Maintenance**
   - Continuous quality monitoring
   - Automatic validation updates
   - Audit trail maintenance

### 3. TimescaleDB Features Used
- Hypertables for time-series optimization
- Automatic partitioning
- Efficient time-based queries
- Data retention policies

## Best Practices

1. **Data Quality**
   - Regular monitoring of validation_status
   - Review of quality metrics
   - Audit trail analysis

2. **Performance**
   - Use of appropriate indexes
   - Regular maintenance
   - Partition management

3. **Data Integrity**
   - Trigger-based validation
   - Audit trail maintenance
   - Quality control checks

## Conclusion
This structure provides a robust, scalable, and maintainable solution for managing meter data in the HES system, with comprehensive tracking, validation, and auditing capabilities. 