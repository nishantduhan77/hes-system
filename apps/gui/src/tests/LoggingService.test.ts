import { LoggingService, LoggingConfig } from '../services/LoggingService';
import * as fs from 'fs';
import * as path from 'path';

describe('LoggingService', () => {
    const testLogFile = path.join(__dirname, 'test.log');
    let loggingService: LoggingService;

    beforeEach(() => {
        // Clean up test log file if it exists
        if (fs.existsSync(testLogFile)) {
            fs.unlinkSync(testLogFile);
        }
    });

    afterEach(async () => {
        // Flush logs and clean up
        if (loggingService) {
            await loggingService.flush();
        }
        if (fs.existsSync(testLogFile)) {
            fs.unlinkSync(testLogFile);
        }
    });

    describe('Logging Configuration', () => {
        it('should create instance with console logging', () => {
            const config: LoggingConfig = {
                level: 'info',
                console: true
            };
            loggingService = LoggingService.getInstance(config);
            expect(loggingService).toBeDefined();
        });

        it('should create instance with file logging', () => {
            const config: LoggingConfig = {
                level: 'info',
                console: false,
                filename: testLogFile
            };
            loggingService = LoggingService.getInstance(config);
            expect(loggingService).toBeDefined();
            expect(fs.existsSync(testLogFile)).toBeTruthy();
        });
    });

    describe('Logging Methods', () => {
        beforeEach(() => {
            const config: LoggingConfig = {
                level: 'debug',
                console: false,
                filename: testLogFile
            };
            loggingService = LoggingService.getInstance(config);
        });

        it('should log info messages', async () => {
            const testMessage = 'Test info message';
            loggingService.info(testMessage);
            await loggingService.flush();

            const logContent = fs.readFileSync(testLogFile, 'utf8');
            expect(logContent).toContain(testMessage);
            expect(logContent).toContain('"level":"info"');
        });

        it('should log error messages with stack trace', async () => {
            const testError = new Error('Test error');
            loggingService.error('Error occurred', testError);
            await loggingService.flush();

            const logContent = fs.readFileSync(testLogFile, 'utf8');
            expect(logContent).toContain('Test error');
            expect(logContent).toContain('"level":"error"');
            expect(logContent).toContain(testError.stack);
        });

        it('should log warning messages with metadata', async () => {
            const testMessage = 'Test warning';
            const metadata = { component: 'test', value: 123 };
            loggingService.warn(testMessage, metadata);
            await loggingService.flush();

            const logContent = fs.readFileSync(testLogFile, 'utf8');
            expect(logContent).toContain(testMessage);
            expect(logContent).toContain('"level":"warn"');
            expect(logContent).toContain('"component":"test"');
            expect(logContent).toContain('"value":123');
        });

        it('should log debug messages', async () => {
            const testMessage = 'Test debug message';
            loggingService.debug(testMessage);
            await loggingService.flush();

            const logContent = fs.readFileSync(testLogFile, 'utf8');
            expect(logContent).toContain(testMessage);
            expect(logContent).toContain('"level":"debug"');
        });
    });

    describe('Singleton Pattern', () => {
        it('should return same instance for multiple getInstance calls', () => {
            const instance1 = LoggingService.getInstance();
            const instance2 = LoggingService.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should maintain configuration after first initialization', () => {
            const config: LoggingConfig = {
                level: 'debug',
                console: true
            };
            const instance1 = LoggingService.getInstance(config);
            const instance2 = LoggingService.getInstance({
                level: 'error',
                console: false
            });
            expect(instance1).toBe(instance2);
        });
    });
}); 