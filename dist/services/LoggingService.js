"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const winston_1 = require("winston");
class LoggingService {
    constructor(config) {
        const logTransports = [];
        // Add console transport if enabled
        if (config.console) {
            logTransports.push(new winston_1.transports.Console({
                format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.timestamp(), winston_1.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                }))
            }));
        }
        // Add file transport if filename is provided
        if (config.filename) {
            logTransports.push(new winston_1.transports.File({
                filename: config.filename,
                format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json())
            }));
        }
        this.logger = (0, winston_1.createLogger)({
            level: config.level || 'info',
            transports: logTransports,
            defaultMeta: { service: 'meter-data-service' }
        });
    }
    static getInstance(config) {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService(config || {
                level: 'info',
                console: true
            });
        }
        return LoggingService.instance;
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    error(message, error, meta) {
        this.logger.error(message, {
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : undefined,
            ...meta
        });
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    async flush() {
        await Promise.all(this.logger.transports.map(t => new Promise((resolve) => t.on('finish', resolve))));
    }
}
exports.LoggingService = LoggingService;
