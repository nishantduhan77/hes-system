import { EventEmitter } from 'events';
import { PowerQualityEvent } from '../data/DataGenerationManager';
import * as winston from 'winston';
import { SecurityLevel } from '../cosem/data/Types';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR'
}

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    category: string;
    message: string;
    data?: any;
}

export interface SimulatorEvent {
    type: 'data_generation' | 'power_quality' | 'communication' | 'system';
    timestamp: Date;
    details: any;
}

/**
 * Simulator Logger Class
 * Handles logging and monitoring of simulator events
 */
export class SimulatorLogger extends EventEmitter {
    private static instance: SimulatorLogger;
    private logger!: winston.Logger;
    private securityLogger!: winston.Logger;
    private logs: LogEntry[];
    private events: SimulatorEvent[];
    private maxLogEntries: number;
    private maxEvents: number;

    private constructor() {
        super();
        this.logs = [];
        this.events = [];
        this.maxLogEntries = 10000; // Keep last 10000 log entries
        this.maxEvents = 5000;      // Keep last 5000 events
        this.initializeLoggers();
    }

    private initializeLoggers(): void {
        // Main logger configuration
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' })
            ]
        });

        // Security logger configuration
        this.securityLogger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/security.log' })
            ]
        });

        // Add console transport in development
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
            this.securityLogger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
        }
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SimulatorLogger {
        if (!SimulatorLogger.instance) {
            SimulatorLogger.instance = new SimulatorLogger();
        }
        return SimulatorLogger.instance;
    }

    /**
     * Log a message
     */
    public log(
        level: LogLevel,
        category: string,
        message: string,
        data?: any
    ): void {
        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            category,
            message,
            data
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogEntries) {
            this.logs.shift();
        }

        this.emit('log', entry);
    }

    /**
     * Record a simulator event
     */
    public recordEvent(
        type: SimulatorEvent['type'],
        details: any
    ): void {
        const event: SimulatorEvent = {
            type,
            timestamp: new Date(),
            details
        };

        this.events.push(event);
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        this.emit('event', event);
    }

    /**
     * Log data generation
     */
    public logDataGeneration(values: any): void {
        this.log(
            LogLevel.DEBUG,
            'DataGeneration',
            'Generated new values',
            values
        );

        this.recordEvent('data_generation', {
            values,
            timestamp: new Date()
        });
    }

    /**
     * Log power quality event
     */
    public logPowerQualityEvent(event: PowerQualityEvent): void {
        this.log(
            LogLevel.INFO,
            'PowerQuality',
            `Power quality event: ${event.type}`,
            event
        );

        this.recordEvent('power_quality', event);
    }

    /**
     * Log communication event
     */
    public logCommunication(
        channelId: string,
        status: string,
        details?: any
    ): void {
        this.log(
            LogLevel.INFO,
            'Communication',
            `Channel ${channelId}: ${status}`,
            details
        );

        this.recordEvent('communication', {
            channelId,
            status,
            details,
            timestamp: new Date()
        });
    }

    /**
     * Log system event
     */
    public logSystem(
        component: string,
        status: string,
        details?: any
    ): void {
        this.log(
            LogLevel.INFO,
            'System',
            `${component}: ${status}`,
            details
        );

        this.recordEvent('system', {
            component,
            status,
            details,
            timestamp: new Date()
        });
    }

    /**
     * Log error
     */
    public logError(
        category: string,
        error: Error | string,
        details?: any
    ): void {
        const message = error instanceof Error ? error.message : error;
        const stack = error instanceof Error ? error.stack : undefined;

        this.log(
            LogLevel.ERROR,
            category,
            message,
            { ...details, stack }
        );

        this.emit('error', {
            category,
            message,
            details,
            stack,
            timestamp: new Date()
        });
    }

    /**
     * Get logs by level
     */
    public getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Get logs by category
     */
    public getLogsByCategory(category: string): LogEntry[] {
        return this.logs.filter(log => log.category === category);
    }

    /**
     * Get events by type
     */
    public getEventsByType(type: SimulatorEvent['type']): SimulatorEvent[] {
        return this.events.filter(event => event.type === type);
    }

    /**
     * Get events in time range
     */
    public getEventsInRange(startTime: Date, endTime: Date): SimulatorEvent[] {
        return this.events.filter(event => 
            event.timestamp >= startTime && event.timestamp <= endTime
        );
    }

    /**
     * Clear old logs
     */
    public clearOldLogs(olderThan: Date): void {
        this.logs = this.logs.filter(log => log.timestamp >= olderThan);
        this.events = this.events.filter(event => event.timestamp >= olderThan);
    }

    /**
     * Set maximum log entries
     */
    public setMaxLogEntries(max: number): void {
        this.maxLogEntries = max;
        if (this.logs.length > max) {
            this.logs = this.logs.slice(-max);
        }
    }

    /**
     * Set maximum events
     */
    public setMaxEvents(max: number): void {
        this.maxEvents = max;
        if (this.events.length > max) {
            this.events = this.events.slice(-max);
        }
    }

    /**
     * Log security events
     */
    public logSecurity(
        component: string,
        eventType: string,
        details: Record<string, any>
    ): void {
        const logEntry = {
            component,
            eventType,
            details,
            timestamp: new Date().toISOString()
        };

        this.securityLogger.info('Security Event', logEntry);
        this.emit('securityEvent', logEntry);

        // Log high severity security events as errors
        if (this.isHighSeverityEvent(eventType)) {
            this.securityLogger.error('High Severity Security Event', logEntry);
            this.emit('highSeveritySecurityEvent', logEntry);
        }
    }

    /**
     * Determine if a security event is high severity
     */
    private isHighSeverityEvent(eventType: string): boolean {
        const highSeverityEvents = [
            'AUTHENTICATION_FAILURE',
            'ACCESS_DENIED',
            'CERTIFICATE_VALIDATION_FAILURE',
            'ENCRYPTION_FAILURE',
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            'SECURITY_POLICY_VIOLATION',
            'KEY_COMPROMISE_DETECTED'
        ];

        return highSeverityEvents.includes(eventType);
    }

    /**
     * Log authentication events
     */
    public logAuthentication(
        clientId: number,
        success: boolean,
        details: Record<string, any>
    ): void {
        const eventType = success ? 'AUTHENTICATION_SUCCESS' : 'AUTHENTICATION_FAILURE';
        this.logSecurity('Authentication', eventType, {
            clientId,
            ...details
        });
    }

    /**
     * Log encryption events
     */
    public logEncryption(
        component: string,
        operation: 'ENCRYPT' | 'DECRYPT',
        success: boolean,
        details: Record<string, any>
    ): void {
        const eventType = success ? `${operation}_SUCCESS` : `${operation}_FAILURE`;
        this.logSecurity(component, eventType, details);
    }

    /**
     * Log certificate events
     */
    public logCertificate(
        operation: string,
        success: boolean,
        details: Record<string, any>
    ): void {
        const eventType = success ? `CERTIFICATE_${operation}_SUCCESS` : `CERTIFICATE_${operation}_FAILURE`;
        this.logSecurity('CertificateManager', eventType, details);
    }
} 