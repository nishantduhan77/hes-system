import { EventEmitter } from 'events';
import { SimulatorLogger } from '../monitoring/SimulatorLogger';
import { SystemError, SystemState, ComponentType } from '../recovery/RecoveryManager';

export enum NotificationPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum NotificationType {
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO',
    RECOVERY = 'RECOVERY',
    STATE_CHANGE = 'STATE_CHANGE'
}

export interface Notification {
    id: string;
    timestamp: Date;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    details: Record<string, any>;
    acknowledged: boolean;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
}

interface NotificationFilter {
    type?: NotificationType[];
    priority?: NotificationPriority[];
    startTime?: Date;
    endTime?: Date;
    acknowledged?: boolean;
}

export class NotificationManager extends EventEmitter {
    private static instance: NotificationManager;
    private logger: SimulatorLogger;
    private notifications: Map<string, Notification>;
    private subscribers: Map<string, (notification: Notification) => void>;

    private constructor() {
        super();
        this.logger = SimulatorLogger.getInstance();
        this.notifications = new Map();
        this.subscribers = new Map();
    }

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    /**
     * Create notification from system error
     */
    public notifyError(error: SystemError): string {
        const notification: Notification = {
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
    public notifyStateChange(
        component: ComponentType,
        oldState: SystemState,
        newState: SystemState
    ): string {
        const notification: Notification = {
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
    public notifyRecovery(error: SystemError): string {
        const notification: Notification = {
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
    private addNotification(notification: Notification): string {
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
    public acknowledgeNotification(id: string, acknowledgedBy: string): void {
        const notification = this.notifications.get(id);
        if (!notification || notification.acknowledged) return;

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
    public subscribe(
        subscriberId: string,
        callback: (notification: Notification) => void
    ): void {
        this.subscribers.set(subscriberId, callback);
    }

    /**
     * Unsubscribe from notifications
     */
    public unsubscribe(subscriberId: string): void {
        this.subscribers.delete(subscriberId);
    }

    /**
     * Notify all subscribers
     */
    private notifySubscribers(notification: Notification): void {
        this.subscribers.forEach(callback => {
            try {
                callback(notification);
            } catch (error) {
                this.logger.logError('NotificationManager', error as Error);
            }
        });
    }

    /**
     * Get notifications with optional filtering
     */
    public getNotifications(filter?: NotificationFilter): Notification[] {
        let notifications = Array.from(this.notifications.values());

        if (filter) {
            if (filter.type) {
                notifications = notifications.filter(n => filter.type?.includes(n.type));
            }
            if (filter.priority) {
                notifications = notifications.filter(n => filter.priority?.includes(n.priority));
            }
            if (filter.startTime) {
                notifications = notifications.filter(n => n.timestamp >= filter.startTime!);
            }
            if (filter.endTime) {
                notifications = notifications.filter(n => n.timestamp <= filter.endTime!);
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
    public getUnacknowledgedNotifications(): Notification[] {
        return this.getNotifications({ acknowledged: false });
    }

    /**
     * Get high priority notifications
     */
    public getHighPriorityNotifications(): Notification[] {
        return this.getNotifications({
            priority: [NotificationPriority.HIGH, NotificationPriority.CRITICAL],
            acknowledged: false
        });
    }

    /**
     * Map error severity to notification priority
     */
    private mapSeverityToPriority(severity: SystemError['severity']): NotificationPriority {
        const priorityMap: Record<SystemError['severity'], NotificationPriority> = {
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
    private getStatePriority(state: SystemState): NotificationPriority {
        switch (state) {
            case SystemState.HEALTHY:
                return NotificationPriority.LOW;
            case SystemState.DEGRADED:
                return NotificationPriority.MEDIUM;
            case SystemState.CRITICAL:
            case SystemState.FAILED:
                return NotificationPriority.CRITICAL;
            case SystemState.RECOVERING:
                return NotificationPriority.HIGH;
            default:
                return NotificationPriority.MEDIUM;
        }
    }

    /**
     * Generate unique notification ID
     */
    private generateNotificationId(): string {
        return `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
} 