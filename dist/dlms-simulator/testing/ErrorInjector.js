"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorInjector = void 0;
const events_1 = require("events");
const SimulatorLogger_1 = require("../core/monitoring/SimulatorLogger");
const TestFrameworkManager_1 = require("./TestFrameworkManager");
class ErrorInjector extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = SimulatorLogger_1.SimulatorLogger.getInstance();
        this.activeInjections = new Map();
        this.injectedErrors = new Map();
        this.errorTypes = new Map();
        this.initializeErrorTypes();
    }
    /**
     * Initialize error types
     */
    initializeErrorTypes() {
        // Communication Errors
        this.errorTypes.set('COMMUNICATION_TIMEOUT', async () => {
            await this.injectCommunicationTimeout();
        });
        this.errorTypes.set('CONNECTION_DROP', async () => {
            await this.injectConnectionDrop();
        });
        // Protocol Errors
        this.errorTypes.set('MALFORMED_FRAME', async () => {
            await this.injectMalformedFrame();
        });
        this.errorTypes.set('INVALID_CHECKSUM', async () => {
            await this.injectInvalidChecksum();
        });
        // Data Errors
        this.errorTypes.set('CORRUPT_DATA', async () => {
            await this.injectCorruptData();
        });
        this.errorTypes.set('INVALID_VALUE', async () => {
            await this.injectInvalidValue();
        });
        // Security Errors
        this.errorTypes.set('AUTHENTICATION_FAILURE', async () => {
            await this.injectAuthenticationFailure();
        });
        this.errorTypes.set('ENCRYPTION_ERROR', async () => {
            await this.injectEncryptionError();
        });
    }
    /**
     * Start error injection
     */
    async startInjection(testId, config) {
        this.validateConfig(config);
        this.injectedErrors.set(testId, []);
        const interval = (60 * 1000) / config.frequency; // Convert frequency to milliseconds
        const injectionCount = Math.floor((config.duration * 1000) / interval);
        let count = 0;
        const timer = setInterval(async () => {
            if (count >= injectionCount) {
                this.stopInjection(testId);
                return;
            }
            try {
                await this.injectError(testId, config);
                count++;
            }
            catch (error) {
                this.logger.logError('ErrorInjector', error);
            }
        }, interval);
        this.activeInjections.set(testId, timer);
        // Set timeout to stop injection
        setTimeout(() => {
            this.stopInjection(testId);
        }, config.duration * 1000);
    }
    /**
     * Stop error injection
     */
    async stopInjection(testId) {
        const timer = this.activeInjections.get(testId);
        if (timer) {
            clearInterval(timer);
            this.activeInjections.delete(testId);
            this.completeInjection(testId);
        }
    }
    /**
     * Inject a single error
     */
    async injectError(testId, config) {
        const errorFunc = this.errorTypes.get(config.errorType);
        if (!errorFunc) {
            throw new Error(`Unknown error type: ${config.errorType}`);
        }
        try {
            await errorFunc();
            const error = {
                type: config.errorType,
                target: config.target,
                timestamp: new Date(),
                details: {
                    success: true
                }
            };
            const errors = this.injectedErrors.get(testId) || [];
            errors.push(error);
            this.injectedErrors.set(testId, errors);
            this.logger.logSystem('ErrorInjector', 'Error injected', {
                testId,
                errorType: config.errorType,
                target: config.target
            });
        }
        catch (error) {
            this.logger.logError('ErrorInjector', error);
        }
    }
    /**
     * Complete injection and emit results
     */
    completeInjection(testId) {
        const errors = this.injectedErrors.get(testId) || [];
        const result = {
            testId,
            testType: TestFrameworkManager_1.TestType.ERROR_INJECTION,
            startTime: errors[0]?.timestamp || new Date(),
            endTime: new Date(),
            success: true,
            metrics: {
                totalErrors: errors.length,
                successfulInjections: errors.filter(e => e.details.success).length,
                failedInjections: errors.filter(e => !e.details.success).length
            },
            errors: [],
            details: {
                injectedErrors: errors
            }
        };
        this.emit('testComplete', result);
        this.injectedErrors.delete(testId);
    }
    /**
     * Validate configuration
     */
    validateConfig(config) {
        if (!config.errorType) {
            throw new Error('Error type must be specified');
        }
        if (!this.errorTypes.has(config.errorType)) {
            throw new Error(`Unknown error type: ${config.errorType}`);
        }
        if (!config.target) {
            throw new Error('Target must be specified');
        }
        if (config.frequency <= 0) {
            throw new Error('Frequency must be greater than 0');
        }
        if (config.duration <= 0) {
            throw new Error('Duration must be greater than 0');
        }
    }
    // Error Injection Implementations
    async injectCommunicationTimeout() {
        // Simulate communication timeout
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    async injectConnectionDrop() {
        // Simulate connection drop
        // Implementation would depend on the communication channel
    }
    async injectMalformedFrame() {
        // Simulate malformed DLMS frame
        // Implementation would modify frame structure
    }
    async injectInvalidChecksum() {
        // Simulate invalid frame checksum
        // Implementation would modify frame checksum
    }
    async injectCorruptData() {
        // Simulate corrupted data
        // Implementation would modify data content
    }
    async injectInvalidValue() {
        // Simulate invalid value in data
        // Implementation would modify value ranges
    }
    async injectAuthenticationFailure() {
        // Simulate authentication failure
        // Implementation would modify authentication data
    }
    async injectEncryptionError() {
        // Simulate encryption error
        // Implementation would modify encryption process
    }
}
exports.ErrorInjector = ErrorInjector;
