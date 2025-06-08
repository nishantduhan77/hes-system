import { createLogger, format, transports, Logger } from 'winston';

export interface LoggingConfig {
    level: string;
    filename?: string;
    console: boolean;
    format?: string;
}

export class LoggingService {
    private logger: Logger;
    private static instance: LoggingService;

    private constructor(config: LoggingConfig) {
        const logTransports = [];

        // Add console transport if enabled
        if (config.console) {
            logTransports.push(new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.timestamp(),
                    format.printf(({ timestamp, level, message, ...meta }) => {
                        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                    })
                )
            }));
        }

        // Add file transport if filename is provided
        if (config.filename) {
            logTransports.push(new transports.File({
                filename: config.filename,
                format: format.combine(
                    format.timestamp(),
                    format.json()
                )
            }));
        }

        this.logger = createLogger({
            level: config.level || 'info',
            transports: logTransports,
            defaultMeta: { service: 'meter-data-service' }
        });
    }

    public static getInstance(config?: LoggingConfig): LoggingService {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService(config || {
                level: 'info',
                console: true
            });
        }
        return LoggingService.instance;
    }

    public info(message: string, meta?: any): void {
        this.logger.info(message, meta);
    }

    public error(message: string, error?: Error, meta?: any): void {
        this.logger.error(message, {
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : undefined,
            ...meta
        });
    }

    public warn(message: string, meta?: any): void {
        this.logger.warn(message, meta);
    }

    public debug(message: string, meta?: any): void {
        this.logger.debug(message, meta);
    }

    public async flush(): Promise<void> {
        await Promise.all(
            this.logger.transports.map(t => 
                new Promise((resolve) => t.on('finish', resolve))
        ));
    }
} 