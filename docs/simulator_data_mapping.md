# Simulator Data Mapping

## Table Mappings with OBIS Codes

### 1. meter_readings (General Purpose)
- **Purpose**: Generic readings not covered by specific tables
- **OBIS Codes**:
  - `0.0.1.0.0.255` - Clock (Real-time clock)
  - `0.0.96.1.0.255` - Meter Serial Number
  - `0.0.96.1.1.255` - Meter Model
  - `0.0.96.1.2.255` - Firmware Version

### 2. power_readings
- **Purpose**: Active, Reactive, and Apparent Power measurements
- **OBIS Codes**:
  - `1.0.1.7.0.255` - Active Power+ (Total)
  - `1.0.2.7.0.255` - Active Power- (Total)
  - `1.0.3.7.0.255` - Reactive Power+ (Total)
  - `1.0.4.7.0.255` - Reactive Power- (Total)
  - `1.0.9.7.0.255` - Apparent Power+ (Total)
  - `1.0.10.7.0.255` - Apparent Power- (Total)
  - Phase-wise Power:
    - `1.0.21.7.0.255` - L1 Active Power+
    - `1.0.41.7.0.255` - L2 Active Power+
    - `1.0.61.7.0.255` - L3 Active Power+

### 3. energy_measurements
- **Purpose**: Energy consumption and generation
- **OBIS Codes**:
  - `1.0.1.8.0.255` - Active Energy+ (Total Import)
  - `1.0.2.8.0.255` - Active Energy- (Total Export)
  - `1.0.3.8.0.255` - Reactive Energy+ (Total)
  - `1.0.4.8.0.255` - Reactive Energy- (Total)
  - Phase-wise Energy:
    - `1.0.21.8.0.255` - L1 Active Energy+
    - `1.0.41.8.0.255` - L2 Active Energy+
    - `1.0.61.8.0.255` - L3 Active Energy+

### 4. voltage_measurements
- **Purpose**: Voltage readings for each phase
- **OBIS Codes**:
  - `1.0.32.7.0.255` - L1 Voltage
  - `1.0.52.7.0.255` - L2 Voltage
  - `1.0.72.7.0.255` - L3 Voltage
  - `1.0.32.24.0.255` - L1 Voltage THD
  - `1.0.52.24.0.255` - L2 Voltage THD
  - `1.0.72.24.0.255` - L3 Voltage THD

### 5. current_measurements
- **Purpose**: Current readings for each phase
- **OBIS Codes**:
  - `1.0.31.7.0.255` - L1 Current
  - `1.0.51.7.0.255` - L2 Current
  - `1.0.71.7.0.255` - L3 Current
  - `1.0.31.24.0.255` - L1 Current THD
  - `1.0.51.24.0.255` - L2 Current THD
  - `1.0.71.24.0.255` - L3 Current THD

### 6. daily_load_profile
- **Purpose**: 24-hour load profile data
- **OBIS Codes**:
  - `1.0.99.1.0.255` - Load Profile 1 (24 hourly values)
  - `1.0.1.8.1.255` - Active Energy+ (Rate 1)
  - `1.0.1.8.2.255` - Active Energy+ (Rate 2)
  - Daily Consumption:
    - `1.0.1.8.0.1` - Previous Day Total
    - `1.0.1.8.0.2` - Current Day Total

### 7. block_load_profile
- **Purpose**: Block/interval-wise load data
- **OBIS Codes**:
  - `1.0.99.2.0.255` - Load Profile 2 (15/30 min intervals)
  - Block Interval Data:
    - `1.0.1.29.0.255` - Block 1 Energy
    - `1.0.2.29.0.255` - Block 2 Energy
    - `1.0.3.29.0.255` - Block 3 Energy

### 8. billing_profile
- **Purpose**: Billing-related measurements
- **OBIS Codes**:
  - `1.0.98.1.0.255` - Billing Profile
  - `1.0.1.8.1.255` - Active Energy+ (Tariff 1)
  - `1.0.1.8.2.255` - Active Energy+ (Tariff 2)
  - `1.0.1.8.3.255` - Active Energy+ (Tariff 3)
  - `1.0.1.8.4.255` - Active Energy+ (Tariff 4)
  - Maximum Demand:
    - `1.0.1.6.1.255` - Maximum Demand (Tariff 1)
    - `1.0.1.6.2.255` - Maximum Demand (Tariff 2)

### 9. instant_profile
- **Purpose**: Real-time instantaneous values
- **OBIS Codes**:
  - Power Factor:
    - `1.0.13.7.0.255` - Power Factor (Total)
    - `1.0.33.7.0.255` - L1 Power Factor
    - `1.0.53.7.0.255` - L2 Power Factor
    - `1.0.73.7.0.255` - L3 Power Factor
  - Frequency:
    - `1.0.14.7.0.255` - Supply Frequency

## Data Generation Guidelines

1. **Quality Indicators**:
   - Normal Reading: 192
   - Estimated Value: 128
   - Invalid Reading: 64
   - Manual Reading: 96

2. **Validation Status**:
   - UNVALIDATED
   - VALID
   - INVALID
   - ESTIMATED
   - MANUALLY_VALIDATED

3. **Communication Status**:
   - SUCCESS
   - TIMEOUT
   - ERROR
   - PARTIAL

4. **Source Types**:
   - NORMAL_READ
   - AUTO_READ
   - MANUAL_READ
   - ESTIMATED
   - CALCULATED

## Simulator Enhancement Requirements

1. **Data Generation**:
   - Generate realistic values within typical ranges
   - Maintain consistency across related measurements
   - Follow proper unit conventions

2. **Time Series Aspects**:
   - Generate data at appropriate intervals
   - Maintain proper timestamps
   - Consider time zones

3. **Data Quality**:
   - Introduce occasional quality issues
   - Vary communication status
   - Include validation flags

4. **Relationships**:
   - Maintain phase relationships
   - Ensure power factor calculations are realistic
   - Keep energy accumulation logical

## Implementation Notes

1. **Priority Order**:
   - Start with voltage and current measurements
   - Add power readings
   - Implement energy measurements
   - Add derived profiles (daily, block, billing)

2. **Data Consistency**:
   - Total power should match sum of phase powers
   - Energy should accumulate correctly
   - Power factors should be realistic

3. **Error Simulation**:
   - Communication failures
   - Quality issues
   - Missing readings
   - Out-of-range values 