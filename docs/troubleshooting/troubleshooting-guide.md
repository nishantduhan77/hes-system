# Error Handling and Recovery System Troubleshooting Guide

This guide provides solutions for common issues and troubleshooting procedures for the DLMS/COSEM simulator's error handling and recovery system.

## Table of Contents
1. [Common Issues](#common-issues)
2. [Diagnostic Procedures](#diagnostic-procedures)
3. [Recovery Troubleshooting](#recovery-troubleshooting)
4. [Notification Issues](#notification-issues)
5. [System Health Checks](#system-health-checks)
6. [Logging and Debugging](#logging-and-debugging)

## Common Issues

### Recovery Manager Not Starting

**Symptoms:**
- No error recovery attempts
- No error notifications
- System state not updating

**Solutions:**
1. Check if RecoveryManager singleton is properly initialized:
```typescript
const recoveryManager = RecoveryManager.getInstance();
console.log('Recovery Manager State:', recoveryManager.getSystemHealth());
```

2. Verify environment configuration:
```typescript
console.log('Environment Config:', {
    maxRetries: process.env.RECOVERY_MAX_RETRIES,
    baseDelay: process.env.RECOVERY_BASE_DELAY,
    timeout: process.env.RECOVERY_TIMEOUT
});
```

3. Check for initialization errors in logs:
```bash
grep "RecoveryManager" ./logs/error-system.log | grep "ERROR"
```

### Failed Recovery Procedures

**Symptoms:**
- Repeated recovery attempts
- Escalating error states
- Recovery timeout errors

**Solutions:**
1. Check recovery procedure configuration:
```typescript
const procedure = recoveryManager.getRecoveryProcedure('CONNECTION_ERROR');
console.log('Procedure Config:', procedure);
```

2. Monitor recovery attempts:
```typescript
recoveryManager.on('recoveryAttempt', (details) => {
    console.log('Recovery Attempt:', {
        errorId: details.errorId,
        attempt: details.attempt,
        success: details.success,
        duration: details.duration
    });
});
```

3. Verify timeout settings:
```typescript
const error = recoveryManager.getActiveErrors()[0];
console.log('Error Recovery Status:', {
    attempts: error.recoveryAttempts,
    timeElapsed: Date.now() - error.timestamp.getTime(),
    timeout: error.timeout
});
```

### Notification Delivery Issues

**Symptoms:**
- Missing notifications
- Delayed notifications
- Duplicate notifications

**Solutions:**
1. Check notification queue status:
```typescript
const notificationManager = NotificationManager.getInstance();
console.log('Notification Queue:', {
    pending: notificationManager.getPendingCount(),
    failed: notificationManager.getFailedCount()
});
```

2. Verify subscriber connections:
```typescript
const subscribers = notificationManager.getSubscribers();
subscribers.forEach(sub => {
    console.log('Subscriber Status:', {
        id: sub.id,
        active: sub.isActive(),
        lastReceived: sub.lastNotificationTime
    });
});
```

3. Monitor notification delivery:
```typescript
notificationManager.on('notificationDelivered', (details) => {
    console.log('Notification Delivered:', {
        id: details.id,
        subscriber: details.subscriberId,
        latency: details.deliveryTime - details.createdTime
    });
});
```

## Diagnostic Procedures

### System Health Check

```typescript
async function performHealthCheck() {
    const recoveryManager = RecoveryManager.getInstance();
    const notificationManager = NotificationManager.getInstance();

    const healthStatus = {
        recovery: {
            state: recoveryManager.getSystemHealth(),
            activeErrors: recoveryManager.getActiveErrors().length,
            procedures: recoveryManager.getRecoveryProcedures().length
        },
        notifications: {
            pending: notificationManager.getPendingCount(),
            failed: notificationManager.getFailedCount(),
            subscribers: notificationManager.getSubscribers().length
        }
    };

    console.log('System Health Status:', healthStatus);
    return healthStatus;
}
```

### Recovery Procedure Diagnosis

```typescript
async function diagnoseRecoveryProcedure(errorType: string) {
    const recoveryManager = RecoveryManager.getInstance();
    const procedure = recoveryManager.getRecoveryProcedure(errorType);

    if (!procedure) {
        console.error(`No recovery procedure found for: ${errorType}`);
        return;
    }

    // Test procedure steps
    for (const step of procedure.steps) {
        try {
            console.log(`Testing step: ${step.description}`);
            const result = await Promise.race([
                step.action(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Step timeout')), step.timeout)
                )
            ]);
            console.log('Step result:', result);
        } catch (error) {
            console.error('Step failed:', error);
        }
    }
}
```

### Notification System Diagnosis

```typescript
async function diagnoseNotificationSystem() {
    const notificationManager = NotificationManager.getInstance();

    // Test notification delivery
    const testNotification = {
        type: NotificationType.INFO,
        priority: NotificationPriority.LOW,
        title: 'Diagnostic Test',
        message: 'Testing notification system'
    };

    try {
        const notificationId = await notificationManager.notifyError(testNotification);
        console.log('Test notification sent:', notificationId);

        // Check delivery status
        setTimeout(async () => {
            const status = await notificationManager.getNotificationStatus(notificationId);
            console.log('Delivery status:', status);
        }, 5000);
    } catch (error) {
        console.error('Notification test failed:', error);
    }
}
```

## Recovery Troubleshooting

### Debug Recovery Steps

```typescript
function debugRecoveryStep(step: RecoveryStep) {
    return async (...args: any[]) => {
        console.log('Starting recovery step:', step.description);
        console.time(step.description);

        try {
            const result = await step.action(...args);
            console.timeEnd(step.description);
            console.log('Step result:', result);
            return result;
        } catch (error) {
            console.timeEnd(step.description);
            console.error('Step failed:', error);
            throw error;
        }
    };
}
```

### Monitor Recovery Performance

```typescript
function monitorRecoveryPerformance() {
    const metrics = {
        attempts: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0
    };

    recoveryManager.on('recoveryAttempt', (details) => {
        metrics.attempts++;
        if (details.success) {
            metrics.successes++;
        } else {
            metrics.failures++;
        }
        metrics.totalDuration += details.duration;

        console.log('Recovery Metrics:', {
            ...metrics,
            successRate: (metrics.successes / metrics.attempts) * 100,
            avgDuration: metrics.totalDuration / metrics.attempts
        });
    });
}
```

## Notification Issues

### Debug Notification Delivery

```typescript
function debugNotificationDelivery(notification: Notification) {
    const steps = [
        'queue',
        'processing',
        'delivery',
        'confirmation'
    ];

    let currentStep = 0;
    const startTime = Date.now();

    return {
        logProgress: (step: string, details: any) => {
            const timestamp = Date.now();
            console.log(`[${timestamp - startTime}ms] ${step}:`, {
                notificationId: notification.id,
                step: steps[currentStep],
                details
            });
            currentStep++;
        },
        complete: () => {
            console.log('Delivery complete:', {
                notificationId: notification.id,
                duration: Date.now() - startTime,
                steps: currentStep
            });
        }
    };
}
```

## System Health Checks

### Component Health Check

```typescript
async function checkComponentHealth(component: ComponentType): Promise<boolean> {
    const recoveryManager = RecoveryManager.getInstance();
    const state = recoveryManager.getComponentState(component);
    
    const activeErrors = recoveryManager.getActiveErrors()
        .filter(error => error.componentType === component);
    
    console.log('Component Health:', {
        component,
        state,
        activeErrors: activeErrors.length,
        details: activeErrors.map(e => ({
            id: e.id,
            type: e.errorType,
            attempts: e.recoveryAttempts
        }))
    });

    return state === SystemState.HEALTHY;
}
```

## Logging and Debugging

### Enable Debug Logging

```typescript
function enableDebugLogging() {
    const logger = SimulatorLogger.getInstance();
    logger.setLevel('debug');
    
    // Log all recovery attempts
    recoveryManager.on('recoveryAttempt', (details) => {
        logger.debug('Recovery Attempt', details);
    });

    // Log all notifications
    notificationManager.on('notificationCreated', (notification) => {
        logger.debug('Notification Created', notification);
    });

    // Log state changes
    recoveryManager.on('componentStateChanged', (change) => {
        logger.debug('State Change', change);
    });
}
```

### Log Analysis Tools

```typescript
async function analyzeErrorLogs(timeRange: { start: Date; end: Date }) {
    const logs = await readLogs(timeRange);
    
    const analysis = {
        errorCount: 0,
        recoveryAttempts: 0,
        successfulRecoveries: 0,
        averageRecoveryTime: 0,
        commonErrors: new Map<string, number>()
    };

    logs.forEach(log => {
        if (log.type === 'error') {
            analysis.errorCount++;
            analysis.commonErrors.set(
                log.errorType,
                (analysis.commonErrors.get(log.errorType) || 0) + 1
            );
        }
        // Add more analysis logic
    });

    return analysis;
}
```

## Best Practices

1. **Regular Health Checks**
   - Implement automated health checks
   - Monitor system metrics
   - Set up alerts for critical states

2. **Proactive Monitoring**
   - Watch for error patterns
   - Track recovery success rates
   - Monitor notification delivery

3. **Performance Optimization**
   - Tune recovery timeouts
   - Adjust batch sizes
   - Optimize notification delivery

4. **Maintenance**
   - Regular log rotation
   - Clean up old notifications
   - Update recovery procedures 