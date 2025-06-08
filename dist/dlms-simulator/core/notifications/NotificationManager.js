"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = exports.NotificationType = exports.NotificationPriority = void 0;
const events_1 = require("events");
const SimulatorLogger_1 = require("../monitoring/SimulatorLogger");
const RecoveryManager_1 = require("../recovery/RecoveryManager");
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["CRITICAL"] = "CRITICAL";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ERROR"] = "ERROR";
    NotificationType["WARNING"] = "WARNING";
    NotificationType["INFO"] = "INFO";
    NotificationType["RECOVERY"] = "RECOVERY";
    NotificationType["STATE_CHANGE"] = "STATE_CHANGE";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class NotificationManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = SimulatorLogger_1.SimulatorLogger.getInstance();
        this.notifications = new Map();
        this.subscribers = new Map();
    }
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }
    /**
     * Create notification from system error
     */
    notifyError(error) {
        const notification = {
            id: this.generateNotificationId(),
            timestamp: new Date(),
            type: NotificationType.ERROR,
            priority: this.mapSeverityToPriority(error.severity),
            title: `${error.componentType} Error: ${error.errorType}`,
            message: error.message,
            details: {
                errorId: error.id,
                componentType: error.componentType,
                errorType: error.errorType,
                ...error.details
            },
            acknowledged: false
        };
        return this.addNotification(notification);
    }
    /**
     * Create notification for state change
     */
    notifyStateChange(component, oldState, newState) {
        const notification = {
            id: this.generateNotificationId(),
            timestamp: new Date(),
            type: NotificationType.STATE_CHANGE,
            priority: this.getStatePriority(newState),
            title: `${component} State Change`,
            message: `${component} state changed from ${oldState} to ${newState}`,
            details: {
                component,
                oldState,
                newState
            },
            acknowledged: false
        };
        return this.addNotification(notification);
    }
    /**
     * Create notification for recovery event
     */
    notifyRecovery(error) {
        const notification = {
            id: this.generateNotificationId(),
            timestamp: new Date(),
            type: NotificationType.RECOVERY,
            priority: NotificationPriority.LOW,
            title: `${error.componentType} Recovery Complete`,
            message: `Successfully recovered from ${error.errorType}`,
            details: {
                errorId: error.id,
                componentType: error.componentType,
                errorType: error.errorType,
                recoveryTime: error.resolutionTime
            },
            acknowledged: false
        };
        return this.addNotification(notification);
    }
    /**
     * Add notification and notify subscribers
     */
    addNotification(notification) {
        this.notifications.set(notification.id, notification);
        this.notifySubscribers(notification);
        this.emit('notificationCreated', notification);
        this.logger.logSystem('NotificationManager', 'New notification', {
            id: notification.id,
            type: notification.type,
            priority: notification.priority,
            title: notification.title
        });
        return notification.id;
    }
    /**
     * Acknowledge notification
     */
    acknowledgeNotification(id, acknowledgedBy) {
        const notification = this.notifications.get(id);
        if (!notification || notification.acknowledged)
            return;
        notification.acknowledged = true;
        notification.acknowledgedAt = new Date();
        notification.acknowledgedBy = acknowledgedBy;
        this.emit('notificationAcknowledged', notification);
        this.logger.logSystem('NotificationManager', 'Notification acknowledged', {
            id: notification.id,
            acknowledgedBy
        });
    }
    /**
     * Subscribe to notifications
     */
    subscribe(subscriberId, callback) {
        this.subscribers.set(subscriberId, callback);
    }
    /**
     * Unsubscribe from notifications
     */
    unsubscribe(subscriberId) {
        this.subscribers.delete(subscriberId);
    }
    /**
     * Notify all subscribers
     */
    notifySubscribers(notification) {
        this.subscribers.forEach(callback => {
            try {
                callback(notification);
            }
            catch (error) {
                this.logger.logError('NotificationManager', error);
            }
        });
    }
    /**
     * Get notifications with optional filtering
     */
    getNotifications(filter) {
        let notifications = Array.from(this.notifications.values());
        if (filter) {
            if (filter.type) {
                notifications = notifications.filter(n => filter.type?.includes(n.type));
            }
            if (filter.priority) {
                notifications = notifications.filter(n => filter.priority?.includes(n.priority));
            }
            if (filter.startTime) {
                notifications = notifications.filter(n => n.timestamp >= filter.startTime);
            }
            if (filter.endTime) {
                notifications = notifications.filter(n => n.timestamp <= filter.endTime);
            }
            if (filter.acknowledged !== undefined) {
                notifications = notifications.filter(n => n.acknowledged === filter.acknowledged);
            }
        }
        return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get unacknowledged notifications
     */
    getUnacknowledgedNotifications() {
        return this.getNotifications({ acknowledged: false });
    }
    /**
     * Get high priority notifications
     */
    getHighPriorityNotifications() {
        return this.getNotifications({
            priority: [NotificationPriority.HIGH, NotificationPriority.CRITICAL],
            acknowledged: false
        });
    }
    /**
     * Map error severity to notification priority
     */
    mapSeverityToPriority(severity) {
        const priorityMap = {
            'LOW': NotificationPriority.LOW,
            'MEDIUM': NotificationPriority.MEDIUM,
            'HIGH': NotificationPriority.HIGH,
            'CRITICAL': NotificationPriority.CRITICAL
        };
        return priorityMap[severity];
    }
    /**
     * Get notification priority for system state
     */
    getStatePriority(state) {
        switch (state) {
            case RecoveryManager_1.SystemState.HEALTHY:
                return NotificationPriority.LOW;
            case RecoveryManager_1.SystemState.DEGRADED:
                return NotificationPriority.MEDIUM;
            case RecoveryManager_1.SystemState.CRITICAL:
            case RecoveryManager_1.SystemState.FAILED:
                return NotificationPriority.CRITICAL;
            case RecoveryManager_1.SystemState.RECOVERING:
                return NotificationPriority.HIGH;
            default:
                return NotificationPriority.MEDIUM;
        }
    }
    /**
     * Generate unique notification ID
     */
    generateNotificationId() {
        return `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.NotificationManager = NotificationManager;
