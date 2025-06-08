# Error Handling and Recovery System Usage Examples

This document provides practical examples of using the error handling and recovery system in the DLMS/COSEM simulator.

## Error Reporting Examples

### Report a Communication Error

```typescript
const recoveryManager = RecoveryManager.getInstance();

// Report a connection error
const errorId = await recoveryManager.reportError(
    ComponentType.COMMUNICATION,
    'CONNECTION_ERROR',
    'Failed to establish connection with meter',
    {
        meterAddress: '192.168.1.100',
        port: 4059,
        attempts: 3
    }
);

console.log(`Error reported with ID: ${errorId}`);
```

### Monitor Error Resolution

```typescript
const recoveryManager = RecoveryManager.getInstance();

// Subscribe to error events
recoveryManager.on('errorResolved', (error: SystemError) => {
    console.log(`Error ${error.id} has been resolved`);
    console.log(`Resolution time: ${error.resolutionTime}`);
});

recoveryManager.on('errorEscalated', (error: SystemError) => {
    console.log(`Error ${error.id} has been escalated after ${error.recoveryAttempts} attempts`);
});
```

## Recovery Procedure Examples

### Register Custom Recovery Procedure

```typescript
const recoveryManager = RecoveryManager.getInstance();

// Register a custom recovery procedure
recoveryManager.registerRecoveryProcedure({
    id: 'METER_SYNC_ERROR',
    errorType: 'SYNC_ERROR',
    maxAttempts: 3,
    backoffStrategy: 'EXPONENTIAL',
    steps: [
        {
            description: 'Reset meter time sync flag',
            action: async () => {
                // Implementation
                return true;
            },
            timeout: 5000
        },
        {
            description: 'Resynchronize meter time',
            action: async () => {
                // Implementation
                return true;
            },
            timeout: 10000
        }
    ]
});
```

## Notification System Examples

### Subscribe to Notifications

```typescript
const notificationManager = NotificationManager.getInstance();

// Subscribe to notifications
notificationManager.subscribe('monitoring-service', (notification: Notification) => {
    if (notification.priority === NotificationPriority.CRITICAL) {
        // Handle critical notification
        alertOperations(notification);
    }
    
    if (notification.type === NotificationType.RECOVERY) {
        // Log recovery success
        logRecoverySuccess(notification);
    }
});
```

### Filter and Query Notifications

```typescript
const notificationManager = NotificationManager.getInstance();

// Get high priority unacknowledged notifications
const criticalNotifications = notificationManager.getNotifications({
    priority: [NotificationPriority.HIGH, NotificationPriority.CRITICAL],
    acknowledged: false
});

// Get recent error notifications
const recentErrors = notificationManager.getNotifications({
    type: [NotificationType.ERROR],
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
});
```

## System Health Monitoring

### Monitor Component Health

```typescript
const recoveryManager = RecoveryManager.getInstance();

// Get current system health
const systemHealth = recoveryManager.getSystemHealth();
Object.entries(systemHealth).forEach(([component, state]) => {
    console.log(`${component}: ${state}`);
});

// Monitor state changes
recoveryManager.on('componentStateChanged', ({ component, oldState, newState }) => {
    console.log(`${component} state changed from ${oldState} to ${newState}`);
    
    if (newState === SystemState.CRITICAL) {
        // Take immediate action for critical state
        escalateToOperations(component);
    }
});
```

## Integration with External Systems

### Forward Notifications to External Service

```typescript
const notificationManager = NotificationManager.getInstance();

// Forward notifications to external monitoring system
notificationManager.subscribe('external-monitor', async (notification: Notification) => {
    try {
        await axios.post('https://monitoring-service/api/events', {
            source: 'DLMS-SIMULATOR',
            severity: notification.priority,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.timestamp,
            details: notification.details
        });
    } catch (error) {
        console.error('Failed to forward notification:', error);
    }
});
```

### Custom Recovery Actions

```typescript
const recoveryManager = RecoveryManager.getInstance();

// Register recovery procedure with custom actions
recoveryManager.registerRecoveryProcedure({
    id: 'DATA_BACKUP_ERROR',
    errorType: 'BACKUP_ERROR',
    maxAttempts: 2,
    backoffStrategy: 'LINEAR',
    steps: [
        {
            description: 'Verify backup service status',
            action: async () => {
                const status = await checkBackupService();
                return status === 'RUNNING';
            },
            timeout: 5000
        },
        {
            description: 'Retry backup operation',
            action: async () => {
                return await retryBackup();
            },
            timeout: 30000
        }
    ],
    fallbackProcedure: 'MANUAL_BACKUP'
});
```

## Error Aggregation and Reporting

### Generate Error Report

```typescript
const recoveryManager = RecoveryManager.getInstance();
const notificationManager = NotificationManager.getInstance();

async function generateErrorReport(startTime: Date, endTime: Date) {
    const errors = notificationManager.getNotifications({
        type: [NotificationType.ERROR],
        startTime,
        endTime
    });

    const report = {
        period: {
            start: startTime,
            end: endTime
        },
        summary: {
            total: errors.length,
            resolved: errors.filter(e => e.resolved).length,
            critical: errors.filter(e => e.priority === NotificationPriority.CRITICAL).length
        },
        byComponent: groupErrorsByComponent(errors),
        recoveryMetrics: calculateRecoveryMetrics(errors)
    };

    return report;
} 