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

-- Create hypertable with partitioning
SELECT create_hypertable(
    'meter_readings',
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
}
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