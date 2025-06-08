"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorLogger = exports.LogLevel = void 0;
const events_1 = require("events");
const winston = __importStar(require("winston"));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARNING"] = "WARNING";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Simulator Logger Class
 * Handles logging and monitoring of simulator events
 */
class SimulatorLogger extends events_1.EventEmitter {
    constructor() {
        super();
        this.logs = [];
        this.events = [];
        this.maxLogEntries = 10000; // Keep last 10000 log entries
        this.maxEvents = 5000; // Keep last 5000 events
        this.initializeLoggers();
    }
    initializeLoggers() {
        // Main logger configuration
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' })
            ]
        });
        // Security logger configuration
        this.securityLogger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
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
    static getInstance() {
        if (!SimulatorLogger.instance) {
            SimulatorLogger.instance = new SimulatorLogger();
        }
        return SimulatorLogger.instance;
    }
    /**
     * Log a message
     */
    log(level, category, message, data) {
        const entry = {
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
    recordEvent(type, details) {
        const event = {
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
    logDataGeneration(values) {
        this.log(LogLevel.DEBUG, 'DataGeneration', 'Generated new values', values);
        this.recordEvent('data_generation', {
            values,
            timestamp: new Date()
        });
    }
    /**
     * Log power quality event
     */
    logPowerQualityEvent(event) {
        this.log(LogLevel.INFO, 'PowerQuality', `Power quality event: ${event.type}`, event);
        this.recordEvent('power_quality', event);
    }
    /**
     * Log communication event
     */
    logCommunication(channelId, status, details) {
        this.log(LogLevel.INFO, 'Communication', `Channel ${channelId}: ${status}`, details);
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
    logSystem(component, status, details) {
        this.log(LogLevel.INFO, 'System', `${component}: ${status}`, details);
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
    logError(category, error, details) {
        const message = error instanceof Error ? error.message : error;
        const stack = error instanceof Error ? error.stack : undefined;
        this.log(LogLevel.ERROR, category, message, { ...details, stack });
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
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }
    /**
     * Get logs by category
     */
    getLogsByCategory(category) {
        return this.logs.filter(log => log.category === category);
    }
    /**
     * Get events by type
     */
    getEventsByType(type) {
        return this.events.filter(event => event.type === type);
    }
    /**
     * Get events in time range
     */
    getEventsInRange(startTime, endTime) {
        return this.events.filter(event => event.timestamp >= startTime && event.timestamp <= endTime);
    }
    /**
     * Clear old logs
     */
    clearOldLogs(olderThan) {
        this.logs = this.logs.filter(log => log.timestamp >= olderThan);
        this.events = this.events.filter(event => event.timestamp >= olderThan);
    }
    /**
     * Set maximum log entries
     */
    setMaxLogEntries(max) {
        this.maxLogEntries = max;
        if (this.logs.length > max) {
            this.logs = this.logs.slice(-max);
        }
    }
    /**
     * Set maximum events
     */
    setMaxEvents(max) {
        this.maxEvents = max;
        if (this.events.length > max) {
            this.events = this.events.slice(-max);
        }
    }
    /**
     * Log security events
     */
    logSecurity(component, eventType, details) {
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
    isHighSeverityEvent(eventType) {
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
    logAuthentication(clientId, success, details) {
        const eventType = success ? 'AUTHENTICATION_SUCCESS' : 'AUTHENTICATION_FAILURE';
        this.logSecurity('Authentication', eventType, {
            clientId,
            ...details
        });
    }
    /**
     * Log encryption events
     */
    logEncryption(component, operation, success, details) {
        const eventType = success ? `${operation}_SUCCESS` : `${operation}_FAILURE`;
        this.logSecurity(component, eventType, details);
    }
    /**
     * Log certificate events
     */
    logCertificate(operation, success, details) {
        const eventType = success ? `CERTIFICATE_${operation}_SUCCESS` : `CERTIFICATE_${operation}_FAILURE`;
        this.logSecurity('CertificateManager', eventType, details);
    }
}
exports.SimulatorLogger = SimulatorLogger;
