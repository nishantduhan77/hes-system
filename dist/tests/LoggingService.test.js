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
const LoggingService_1 = require("../services/LoggingService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('LoggingService', () => {
    const testLogFile = path.join(__dirname, 'test.log');
    let loggingService;
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
            const config = {
                level: 'info',
                console: true
            };
            loggingService = LoggingService_1.LoggingService.getInstance(config);
            expect(loggingService).toBeDefined();
        });
        it('should create instance with file logging', () => {
            const config = {
                level: 'info',
                console: false,
                filename: testLogFile
            };
            loggingService = LoggingService_1.LoggingService.getInstance(config);
            expect(loggingService).toBeDefined();
            expect(fs.existsSync(testLogFile)).toBeTruthy();
        });
    });
    describe('Logging Methods', () => {
        beforeEach(() => {
            const config = {
                level: 'debug',
                console: false,
                filename: testLogFile
            };
            loggingService = LoggingService_1.LoggingService.getInstance(config);
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
            const instance1 = LoggingService_1.LoggingService.getInstance();
            const instance2 = LoggingService_1.LoggingService.getInstance();
            expect(instance1).toBe(instance2);
        });
        it('should maintain configuration after first initialization', () => {
            const config = {
                level: 'debug',
                console: true
            };
            const instance1 = LoggingService_1.LoggingService.getInstance(config);
            const instance2 = LoggingService_1.LoggingService.getInstance({
                level: 'error',
                console: false
            });
            expect(instance1).toBe(instance2);
        });
    });
});
