# Error Handling and Recovery System Configuration Guide

This guide explains how to configure and customize the error handling and recovery system for the DLMS/COSEM simulator.

## Table of Contents
1. [System Components](#system-components)
2. [Basic Configuration](#basic-configuration)
3. [Recovery Procedures](#recovery-procedures)
4. [Notification System](#notification-system)
5. [Logging Configuration](#logging-configuration)
6. [Database and Data Injection Configuration](#database-and-data-injection-configuration)
7. [Integration Settings](#integration-settings)
8. [Advanced Configuration](#advanced-configuration)

## System Components

The error handling system consists of the following main components:
- RecoveryManager
- NotificationManager
- Error Handlers
- Recovery Procedures
- Notification Subscribers

## Basic Configuration

### Environment Variables

```env
# Recovery System Configuration
RECOVERY_MAX_RETRIES=5
RECOVERY_BASE_DELAY=1000
RECOVERY_MAX_DELAY=30000
RECOVERY_TIMEOUT=60000

# Notification System Configuration
NOTIFICATION_RETENTION_DAYS=30
NOTIFICATION_BATCH_SIZE=100
NOTIFICATION_FLUSH_INTERVAL=5000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_OUTPUT=file
LOG_FILE_PATH=./logs/error-system.log
```

### Component Configuration

```typescript
// config/error-handling.config.ts
export const ErrorHandlingConfig = {
    recovery: {
        maxRetries: process.env.RECOVERY_MAX_RETRIES || 5,
        baseDelay: process.env.RECOVERY_BASE_DELAY || 1000,
        maxDelay: process.env.RECOVERY_MAX_DELAY || 30000,
        timeout: process.env.RECOVERY_TIMEOUT || 60000
    },
    notification: {
        retentionDays: process.env.NOTIFICATION_RETENTION_DAYS || 30,
        batchSize: process.env.NOTIFICATION_BATCH_SIZE || 100,
        flushInterval: process.env.NOTIFICATION_FLUSH_INTERVAL || 5000
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        output: process.env.LOG_OUTPUT || 'file',
        filePath: process.env.LOG_FILE_PATH || './logs/error-system.log'
    }
};
```

## Recovery Procedures

### Default Recovery Procedures

```typescript
// config/recovery-procedures.config.ts
export const DefaultRecoveryProcedures = {
    CONNECTION_ERROR: {
        maxAttempts: 5,
        backoffStrategy: 'EXPONENTIAL',
        timeout: 30000,
        steps: [
            {
                name: 'connection_reset',
                timeout: 5000
            },
            {
                name: 'connection_reinitialize',
                timeout: 10000
            }
        ]
    },
    DATA_ERROR: {
        maxAttempts: 3,
        backoffStrategy: 'LINEAR',
        timeout: 15000,
        steps: [
            {
                name: 'data_validation',
                timeout: 5000
            },
            {
                name: 'data_regeneration',
                timeout: 10000
            }
        ]
    }
};
```

### Custom Recovery Procedure Configuration

```typescript
// Example custom recovery procedure configuration
export const CustomRecoveryProcedures = {
    METER_SYNC_ERROR: {
        maxAttempts: 3,
        backoffStrategy: 'EXPONENTIAL',
        timeout: 20000,
        steps: [
            {
                name: 'sync_check',
                timeout: 5000,
                retryInterval: 1000
            },
            {
                name: 'sync_reset',
                timeout: 10000,
                requiresConfirmation: true
            }
        ],
        fallback: 'MANUAL_SYNC'
    }
};
```

## Notification System

### Notification Categories

```typescript
// config/notification.config.ts
export const NotificationConfig = {
    categories: {
        ERROR: {
            priority: 'HIGH',
            requireAcknowledgment: true,
            retentionDays: 30
        },
        WARNING: {
            priority: 'MEDIUM',
            requireAcknowledgment: false,
            retentionDays: 15
        },
        INFO: {
            priority: 'LOW',
            requireAcknowledgment: false,
            retentionDays: 7
        }
    },
    routing: {
        HIGH: ['email', 'sms', 'dashboard'],
        MEDIUM: ['email', 'dashboard'],
        LOW: ['dashboard']
    }
};
```

### Notification Templates

```typescript
// config/notification-templates.config.ts
export const NotificationTemplates = {
    ERROR: {
        title: '${componentType} Error: ${errorType}',
        message: 'Error occurred in ${componentType}: ${message}',
        email: {
            subject: 'DLMS Simulator Error - ${errorType}',
            body: `
                Error Details:
                - Component: ${componentType}
                - Type: ${errorType}
                - Severity: ${severity}
                - Message: ${message}
                - Time: ${timestamp}
                
                Recovery Status:
                - Attempts: ${recoveryAttempts}
                - Status: ${resolved ? 'Resolved' : 'Pending'}
            `
        }
    }
};
```

## Logging Configuration

### Log Formats

```typescript
// config/logging.config.ts
export const LoggingConfig = {
    formats: {
        json: {
            timestamp: true,
            errorStack: true,
            metadata: true
        },
        text: {
            template: '[${timestamp}] ${level}: ${message}'
        }
    },
    outputs: {
        file: {
            maxSize: '10m',
            maxFiles: 5,
            compress: true
        },
        console: {
            colors: true,
            detailed: true
        }
    }
};
```

## Database and Data Injection Configuration

### Database Settings

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meter_data
DB_USER=admin
DB_PASSWORD=****
DB_POOL_SIZE=10
DB_TIMEOUT=5000
DB_SSL=false

# Data Injection Configuration
INJECTION_INTERVAL=5000
SIMULATION_SPEED=1
METER_COUNT=10
DATA_GENERATION_RATE=REAL_TIME
```

### Data Injection Configuration

```typescript
// config/data-injection.config.ts
export const DataInjectionConfig = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'meter_data',
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD,
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
        timeout: parseInt(process.env.DB_TIMEOUT || '5000'),
        ssl: process.env.DB_SSL === 'true'
    },
    simulator: {
        simulationSpeed: parseInt(process.env.SIMULATION_SPEED || '1'),
        meterCount: parseInt(process.env.METER_COUNT || '10'),
        dataGenerationRate: process.env.DATA_GENERATION_RATE || 'REAL_TIME',
        injectionInterval: parseInt(process.env.INJECTION_INTERVAL || '5000')
    },
    validation: {
        validateDataQuality: true,
        qualityThresholds: {
            voltage: {
                min: 210,
                max: 240,
                unit: 'V'
            },
            current: {
                min: 0,
                max: 100,
                unit: 'A'
            },
            power: {
                min: 0,
                max: 25000,
                unit: 'W'
            },
            frequency: {
                min: 49.5,
                max: 50.5,
                unit: 'Hz'
            }
        }
    },
    errorHandling: {
        maxRetries: 3,
        retryDelay: 1000,
        errorNotificationLevel: 'HIGH',
        errorTypes: {
            DATABASE_ERROR: {
                recoveryStrategy: 'RECONNECT',
                maxAttempts: 5
            },
            VALIDATION_ERROR: {
                recoveryStrategy: 'SKIP',
                logLevel: 'WARNING'
            },
            SIMULATOR_ERROR: {
                recoveryStrategy: 'RESET',
                notifyAdmin: true
            }
        }
    }
};
```

### Database Schema

```sql
-- config/schema.sql
CREATE TABLE meter_readings (
    id SERIAL PRIMARY KEY,
    meter_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    voltage NUMERIC(10,2),
    current NUMERIC(10,2),
    power NUMERIC(10,2),
    frequency NUMERIC(10,2),
    energy_consumption NUMERIC(15,3),
    connection_status VARCHAR(20),
    quality VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meter_alarms (
    id SERIAL PRIMARY KEY,
    meter_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    alarm_type VARCHAR(50) NOT NULL,
    alarm_message TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meter_readings_meter_id ON meter_readings(meter_id);
CREATE INDEX idx_meter_readings_timestamp ON meter_readings(timestamp);
CREATE INDEX idx_meter_alarms_meter_id ON meter_alarms(meter_id);
CREATE INDEX idx_meter_alarms_timestamp ON meter_alarms(timestamp);
```

## Integration Settings

### External System Integration

```typescript
// config/integration.config.ts
export const IntegrationConfig = {
    monitoring: {
        endpoint: process.env.MONITORING_ENDPOINT,
        apiKey: process.env.MONITORING_API_KEY,
        batchSize: 100,
        flushInterval: 5000
    },
    alerting: {
        email: {
            smtp: process.env.SMTP_SERVER,
            port: process.env.SMTP_PORT,
            username: process.env.SMTP_USERNAME,
            password: process.env.SMTP_PASSWORD
        },
        sms: {
            provider: process.env.SMS_PROVIDER,
            apiKey: process.env.SMS_API_KEY
        }
    }
};
```

## Advanced Configuration

### Custom Error Handlers

```typescript
// config/error-handlers.config.ts
export const ErrorHandlerConfig = {
    global: {
        uncaughtException: true,
        unhandledRejection: true,
        exitOnError: false
    },
    handlers: {
        SECURITY_ERROR: {
            priority: 'CRITICAL',
            immediate: true,
            notify: ['security-team', 'admin']
        },
        DATABASE_ERROR: {
            priority: 'HIGH',
            retry: true,
            maxAttempts: 3
        }
    }
};
```

### Performance Tuning

```typescript
// config/performance.config.ts
export const PerformanceConfig = {
    recovery: {
        maxConcurrent: 5,
        queueSize: 1000,
        workerCount: 2
    },
    notification: {
        batchSize: 100,
        flushInterval: 5000,
        maxQueueSize: 10000
    },
    monitoring: {
        sampleRate: 0.1,
        metricsInterval: 60000
    }
};
```

## Configuration Best Practices

1. **Environment-Specific Configuration**
   - Use different configuration files for development, testing, and production
   - Store sensitive values in environment variables
   - Use configuration validation on startup

2. **Recovery Procedure Guidelines**
   - Set appropriate timeouts for each recovery step
   - Configure reasonable retry attempts and backoff strategies
   - Always provide fallback procedures for critical operations

3. **Notification Management**
   - Configure appropriate retention periods for different notification types
   - Set up proper routing rules based on priority
   - Use templates for consistent notification formatting

4. **Logging Considerations**
   - Configure appropriate log levels for different environments
   - Set up log rotation to manage disk space
   - Include relevant context in log messages

5. **Integration Guidelines**
   - Use secure communication channels for external integrations
   - Implement proper error handling for external service failures
   - Configure appropriate timeouts and retry strategies 