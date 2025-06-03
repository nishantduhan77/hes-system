# HES System Backend Architecture

## Overview
The Head End System (HES) backend is designed to handle high-throughput meter data collection, processing, and storage. The architecture is built to scale horizontally and handle millions of meter readings every 30 minutes.

## System Components

### 1. Data Collection Layer
```
[Smart Meters] → [Load Balancer] → [Collection Services]
```

#### Components:
- **DLMS/COSEM Protocol Handler**
  - Handles meter communication
  - Supports multiple protocol versions
  - Connection pooling for efficient meter access

- **Collection Services**
  - Horizontally scalable microservices
  - Built with Spring Boot
  - Handles meter connection/disconnection
  - Manages reading schedules

### 2. Message Queue Layer
```
[Collection Services] → [Kafka Cluster] → [Stream Processing]
```

#### Kafka Configuration:
- **Topics**:
  - `meter-readings` (Partitioned by meter group)
  - `meter-events` (For status changes, alerts)
  - `system-commands` (For meter operations)

- **Partitioning Strategy**:
  ```java
  public class MeterPartitioner implements Partitioner {
      @Override
      public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
          String meterGroup = extractMeterGroup(key.toString());
          return Math.abs(meterGroup.hashCode() % cluster.partitionCountForTopic(topic));
      }
  }
  ```

### 3. Stream Processing Layer
```
[Kafka] → [Apache Flink] → [TimescaleDB/Redis]
```

#### Flink Jobs:
1. **Real-time Aggregation**
   ```java
   public class MeterReadingAggregator extends KeyedProcessFunction<String, MeterReading, AggregatedReading> {
       private ValueState<AggregatedReading> aggregateState;
       
       @Override
       public void processElement(MeterReading reading, Context ctx, Collector<AggregatedReading> out) {
           // 30-minute window aggregation logic
       }
   }
   ```

2. **Data Validation**
   ```java
   public class ReadingValidator extends ProcessFunction<MeterReading, ValidatedReading> {
       @Override
       public void processElement(MeterReading reading, Context ctx, Collector<ValidatedReading> out) {
           // Validation rules application
       }
   }
   ```

### 4. Storage Layer

#### TimescaleDB Schema
```sql
-- Hypertable for raw readings
CREATE TABLE meter_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    reading_type VARCHAR(50),
    value DOUBLE PRECISION,
    quality_code INTEGER,
    PRIMARY KEY (meter_id, timestamp)
);

-- Additional tables for specific meter readings
CREATE TABLE power_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    active_power_import DOUBLE PRECISION,
    active_power_export DOUBLE PRECISION,
    voltage_r_phase DOUBLE PRECISION,
    current_r_phase DOUBLE PRECISION,
    quality_code INTEGER,
    PRIMARY KEY (meter_id, timestamp)
);

-- Create hypertable with partitioning
SELECT create_hypertable(
    'power_readings',
    'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    partitioning_column => 'meter_id',
    number_partitions => 4
);

-- Continuous aggregation policy
CREATE MATERIALIZED VIEW readings_30min_avg WITH (timescaledb.continuous) AS
SELECT
    meter_id,
    time_bucket('30 minutes', timestamp) AS bucket,
    reading_type,
    AVG(value) as avg_value,
    COUNT(*) as reading_count
FROM meter_readings
GROUP BY meter_id, bucket, reading_type;

-- Retention policy
SELECT add_retention_policy(
    'meter_readings',
    INTERVAL '3 months',
    if_not_exists => true
);
```

#### Redis Caching
```java
@Configuration
public class RedisConfig {
    @Bean
    public RedisTemplate<String, MeterReading> redisTemplate() {
        RedisTemplate<String, MeterReading> template = new RedisTemplate<>();
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new Jackson2JsonRedisSerializer<>(MeterReading.class));
        template.setValueSerializer(new Jackson2JsonRedisSerializer<>(MeterReading.class));
        return template;
    }
}
```

### 5. API Layer

#### REST API Endpoints
```java
@RestController
@RequestMapping("/api/v1/meters")
public class MeterController {
    @GetMapping("/{meterId}/readings")
    public ResponseEntity<Page<MeterReading>> getReadings(
        @PathVariable UUID meterId,
        @RequestParam @DateTimeFormat(iso = ISO.DATE_TIME) LocalDateTime from,
        @RequestParam @DateTimeFormat(iso = ISO.DATE_TIME) LocalDateTime to,
        Pageable pageable
    ) {
        // Implementation
    }
    
    @PostMapping("/{meterId}/connect")
    public ResponseEntity<Void> connectMeter(@PathVariable UUID meterId) {
        // Implementation
    }

    @GetMapping("/{meterId}/readings/table")
    public ResponseEntity<Page<PowerReading>> getPowerReadingsTable(
        @PathVariable UUID meterId,
        @RequestParam @DateTimeFormat(iso = ISO.DATE_TIME) LocalDateTime from,
        @RequestParam @DateTimeFormat(iso = ISO.DATE_TIME) LocalDateTime to,
        @RequestParam(defaultValue = "timestamp,desc") String[] sort,
        Pageable pageable
    ) {
        // Implementation for tabular data
    }
}
```

#### Frontend Integration
```typescript
// API Types
interface MeterReading {
    meterId: string;
    timestamp: string;
    readingType: string;
    value: number;
    qualityCode: number;
}

interface PowerReading {
    meterId: string;
    timestamp: string;
    activePowerImport: number;
    activePowerExport: number;
    voltageRPhase: number;
    currentRPhase: number;
    qualityCode: number;
}

// React Query Integration
const useMeterReadings = (meterId: string, from: Date, to: Date) => {
    return useQuery({
        queryKey: ['readings', meterId, from, to],
        queryFn: () => api.getMeterReadings(meterId, from, to),
        staleTime: 30000, // 30 seconds
    });
};

// React Query Integration for Table Data
const usePowerReadingsTable = (
    meterId: string,
    from: Date,
    to: Date,
    page: number,
    pageSize: number,
    sortModel: GridSortModel
) => {
    return useQuery({
        queryKey: ['readings-table', meterId, from, to, page, pageSize, sortModel],
        queryFn: () => api.getPowerReadingsTable(meterId, from, to, {
            page,
            pageSize,
            sort: sortModel.map(s => `${s.field},${s.sort}`).join(';')
        }),
        staleTime: 30000, // 30 seconds
    });
};

// MUI Data Grid Component
const MeterReadingsTable: React.FC<{ meterId: string }> = ({ meterId }) => {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [sortModel, setSortModel] = useState<GridSortModel>([
        { field: 'timestamp', sort: 'desc' }
    ]);

    const { data, isLoading } = usePowerReadingsTable(
        meterId,
        startDate,
        endDate,
        page,
        pageSize,
        sortModel
    );

    const columns: GridColDef[] = [
        {
            field: 'timestamp',
            headerName: 'Time',
            width: 200,
            valueFormatter: (params) => 
                format(new Date(params.value), 'yyyy-MM-dd HH:mm:ss')
        },
        {
            field: 'activePowerImport',
            headerName: 'Active Power Import (kW)',
            width: 180,
            valueFormatter: (params) => 
                params.value.toFixed(2)
        },
        {
            field: 'activePowerExport',
            headerName: 'Active Power Export (kW)',
            width: 180,
            valueFormatter: (params) => 
                params.value.toFixed(2)
        },
        {
            field: 'voltageRPhase',
            headerName: 'Voltage R-Phase (V)',
            width: 160,
            valueFormatter: (params) => 
                params.value.toFixed(1)
        },
        {
            field: 'currentRPhase',
            headerName: 'Current R-Phase (A)',
            width: 160,
            valueFormatter: (params) => 
                params.value.toFixed(2)
        }
    ];

    return (
        <DataGrid
            rows={data?.content || []}
            columns={columns}
            pagination
            paginationMode="server"
            rowCount={data?.totalElements || 0}
            loading={isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            disableSelectionOnClick
            autoHeight
        />
    );
};
```

#### WebSocket Configuration
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }
}
```

## Performance Considerations

### 1. Data Volume Handling
- Expected data volume: ~1M meters × 6 readings/30min = 12M readings/30min
- Average reading size: ~100 bytes
- Total data per 30min: ~1.2GB

### 2. Scaling Strategy
```
[Load Balancer]
      ↓
[Collection Services] × 10 instances
      ↓
[Kafka Cluster] × 5 brokers
      ↓
[Flink Cluster] × 8 nodes
      ↓
[TimescaleDB] × 4 node cluster
```

### 3. Performance Optimizations
1. **Database**
   - Partitioning by time and meter_id
   - Automated chunk management
   - Regular vacuum and analyze
   - Materialized views for common queries

2. **Caching**
   - Redis for hot data (last 24 hours)
   - Application-level caching
   - Query result caching

3. **API**
   - Connection pooling
   - Request rate limiting
   - Response compression
   - Async processing for long operations

## Monitoring and Alerting

### 1. Metrics Collection
```yaml
monitoring:
  metrics:
    - name: meter_reading_rate
      type: counter
      labels: [meter_id, reading_type]
    - name: processing_latency
      type: histogram
      labels: [stage, meter_group]
    - name: storage_write_rate
      type: gauge
      labels: [database, operation_type]
```

### 2. Alert Rules
```yaml
alerts:
  - name: high_latency
    condition: processing_latency > 5s
    severity: warning
  - name: data_loss
    condition: meter_reading_rate == 0 for 5m
    severity: critical
```

## Deployment Architecture

### Production Environment
```
[Region: Primary]
├── Availability Zone 1
│   ├── Collection Services (3 instances)
│   ├── Kafka Brokers (2 nodes)
│   └── TimescaleDB (Primary)
├── Availability Zone 2
│   ├── Collection Services (3 instances)
│   ├── Kafka Brokers (2 nodes)
│   └── TimescaleDB (Replica)
└── Availability Zone 3
    ├── Collection Services (4 instances)
    ├── Kafka Brokers (1 node)
    └── TimescaleDB (Replica)
```

## Security Considerations

### 1. Data Protection
- TLS 1.3 for all communications
- Data encryption at rest
- Regular security audits
- Access control and authentication

### 2. API Security
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) {
        http
            .oauth2ResourceServer()
            .jwt()
            .and()
            .authorizeRequests()
            .antMatchers("/api/v1/**").authenticated()
            .and()
            .csrf().disable();
    }
}
```

## Disaster Recovery

### 1. Backup Strategy
- Continuous WAL archiving
- Daily full backups
- Cross-region replication
- Regular recovery testing

### 2. Recovery Procedures
```bash
# Recovery Time Objective (RTO): 1 hour
# Recovery Point Objective (RPO): 5 minutes

# Backup script
#!/bin/bash
pg_basebackup -D /backup/base -Ft -z -P

# Recovery script
#!/bin/bash
pg_ctl stop -D $PGDATA
rm -rf $PGDATA/*
tar xzf /backup/base.tar.gz -C $PGDATA
echo "restore_command = 'cp /archive/%f %p'" >> $PGDATA/recovery.conf
pg_ctl start -D $PGDATA
```

## Future Enhancements

1. **Machine Learning Integration**
   - Anomaly detection
   - Consumption prediction
   - Maintenance scheduling

2. **Advanced Analytics**
   - Power quality analysis
   - Loss detection
   - Grid optimization

3. **Integration Capabilities**
   - MDM system integration
   - Billing system integration
   - Asset management integration 

## Database Tables and Sample Queries

### Core Tables

1. **meter_readings** - Raw meter readings
```sql
CREATE TABLE meter_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    reading_type VARCHAR(50),
    value DOUBLE PRECISION,
    quality_code INTEGER,
    PRIMARY KEY (meter_id, timestamp)
);
```

2. **power_readings** - Specific power measurements
```sql
CREATE TABLE power_readings (
    meter_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    active_power_import DOUBLE PRECISION,
    active_power_export DOUBLE PRECISION,
    voltage_r_phase DOUBLE PRECISION,
    current_r_phase DOUBLE PRECISION,
    quality_code INTEGER,
    PRIMARY KEY (meter_id, timestamp)
);
```

3. **meters** - Meter information
```sql
CREATE TABLE meters (
    meter_id UUID PRIMARY KEY,
    serial_number VARCHAR(50) UNIQUE,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    installation_date TIMESTAMPTZ,
    firmware_version VARCHAR(50),
    status VARCHAR(20),
    last_communication TIMESTAMPTZ
);
```

### Presentation Queries

1. **Latest Readings for a Specific Meter**
```sql
SELECT 
    timestamp,
    active_power_import,
    active_power_export,
    voltage_r_phase,
    current_r_phase
FROM power_readings
WHERE meter_id = '12345678-1234-5678-1234-567812345678'
    AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;
```

2. **Hourly Power Consumption Average**
```sql
SELECT 
    time_bucket('1 hour', timestamp) AS hour,
    AVG(active_power_import) as avg_import,
    AVG(active_power_export) as avg_export,
    COUNT(*) as reading_count
FROM power_readings
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC;
```

3. **Voltage Quality Analysis**
```sql
SELECT 
    meter_id,
    COUNT(*) as total_readings,
    AVG(voltage_r_phase) as avg_voltage,
    MIN(voltage_r_phase) as min_voltage,
    MAX(voltage_r_phase) as max_voltage,
    COUNT(*) FILTER (WHERE voltage_r_phase < 220) as undervoltage_count,
    COUNT(*) FILTER (WHERE voltage_r_phase > 240) as overvoltage_count
FROM power_readings
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY meter_id;
```

4. **Meter Communication Status**
```sql
SELECT 
    m.serial_number,
    m.manufacturer,
    m.status,
    m.last_communication,
    NOW() - m.last_communication as time_since_last_comm
FROM meters m
WHERE m.status != 'DECOMMISSIONED'
ORDER BY m.last_communication DESC;
```

5. **Daily Energy Consumption Pattern**
```sql
SELECT 
    EXTRACT(HOUR FROM timestamp) as hour_of_day,
    AVG(active_power_import) as avg_consumption
FROM power_readings
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY hour_of_day
ORDER BY hour_of_day;
```

6. **Quality Code Analysis**
```sql
SELECT 
    quality_code,
    COUNT(*) as occurrence_count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM power_readings
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY quality_code
ORDER BY occurrence_count DESC;
```

7. **Missing Data Detection**
```sql
WITH expected_readings AS (
    SELECT generate_series(
        date_trunc('hour', NOW()) - INTERVAL '24 hours',
        date_trunc('hour', NOW()),
        '30 minutes'
    ) as expected_timestamp
)
SELECT 
    m.meter_id,
    m.serial_number,
    e.expected_timestamp,
    CASE WHEN pr.timestamp IS NULL THEN 'Missing' ELSE 'Present' END as reading_status
FROM expected_readings e
CROSS JOIN meters m
LEFT JOIN power_readings pr 
    ON pr.meter_id = m.meter_id 
    AND pr.timestamp = e.expected_timestamp
WHERE pr.timestamp IS NULL
ORDER BY m.meter_id, e.expected_timestamp;
```

8. **Peak Power Usage Times**
```sql
WITH daily_peaks AS (
    SELECT 
        date_trunc('day', timestamp) as day,
        MAX(active_power_import) as peak_import
    FROM power_readings
    WHERE timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY day
)
SELECT 
    pr.timestamp,
    m.serial_number,
    pr.active_power_import,
    pr.voltage_r_phase,
    pr.current_r_phase
FROM daily_peaks dp
JOIN power_readings pr 
    ON date_trunc('day', pr.timestamp) = dp.day 
    AND pr.active_power_import = dp.peak_import
JOIN meters m 
    ON pr.meter_id = m.meter_id
ORDER BY pr.timestamp DESC;
```

### Useful Views

1. **Current Day Summary**
```sql
CREATE OR REPLACE VIEW meter_daily_summary AS
SELECT 
    m.serial_number,
    COUNT(pr.*) as reading_count,
    AVG(pr.active_power_import) as avg_import,
    MAX(pr.active_power_import) as max_import,
    AVG(pr.voltage_r_phase) as avg_voltage,
    MIN(pr.voltage_r_phase) as min_voltage,
    MAX(pr.voltage_r_phase) as max_voltage
FROM meters m
LEFT JOIN power_readings pr 
    ON m.meter_id = pr.meter_id
    AND pr.timestamp >= date_trunc('day', NOW())
GROUP BY m.meter_id, m.serial_number;
```

2. **Meter Health Status**
```sql
CREATE OR REPLACE VIEW meter_health_status AS
SELECT 
    m.serial_number,
    m.status,
    m.last_communication,
    CASE 
        WHEN m.last_communication < NOW() - INTERVAL '24 hours' THEN 'Critical'
        WHEN m.last_communication < NOW() - INTERVAL '6 hours' THEN 'Warning'
        ELSE 'Good'
    END as communication_status,
    COUNT(pr.*) FILTER (WHERE pr.timestamp >= NOW() - INTERVAL '24 hours') as readings_last_24h,
    COUNT(pr.*) FILTER (WHERE pr.quality_code != 0) as error_readings_24h
FROM meters m
LEFT JOIN power_readings pr 
    ON m.meter_id = pr.meter_id
    AND pr.timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY m.meter_id, m.serial_number, m.status, m.last_communication;
``` 