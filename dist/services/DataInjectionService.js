"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataInjectionService = void 0;
const DatabaseService_1 = require("./DatabaseService");
const MeterSimulator_1 = require("./MeterSimulator");
const DataValidator_1 = require("./DataValidator");
const data_injection_config_1 = require("../config/data-injection.config");
const events_1 = __importDefault(require("events"));
class DataInjectionService extends events_1.default {
    constructor(config = data_injection_config_1.defaultConfig) {
        super();
        this.buffer = [];
        this.isProcessing = false;
        this.config = config;
        this.databaseService = new DatabaseService_1.DatabaseService(config.database);
        this.meterSimulator = new MeterSimulator_1.MeterSimulator(config.simulator);
        this.dataValidator = new DataValidator_1.DataValidator(config.validation);
    }
    async start() {
        try {
            // Start the simulation with the processing callback
            await this.meterSimulator.startSimulation(async (readings) => {
                await this.processReadings(readings);
            });
            this.emit('started', {
                timestamp: new Date(),
                config: this.getServiceStatus()
            });
        }
        catch (error) {
            this.emit('error', {
                type: 'START_ERROR',
                message: 'Failed to start data injection service',
                error
            });
            throw error;
        }
    }
    stop() {
        this.meterSimulator.stopSimulation();
        this.emit('stopped', {
            timestamp: new Date(),
            remainingBufferSize: this.buffer.length
        });
    }
    async processReadings(readings) {
        try {
            // Validate the readings
            const validatedReadings = await this.dataValidator.validateBatchReadings(readings);
            // Add to buffer
            this.buffer.push(...validatedReadings);
            // Process buffer if it reaches batch size
            if (this.buffer.length >= this.config.database.poolSize) {
                await this.flushBuffer();
            }
            // Emit processing stats
            const stats = this.dataValidator.getValidationStats(validatedReadings);
            this.emit('processedBatch', {
                timestamp: new Date(),
                stats
            });
        }
        catch (error) {
            this.emit('error', {
                type: 'PROCESSING_ERROR',
                message: 'Error processing readings',
                error
            });
            // Handle error based on configuration
            await this.handleProcessingError(error);
        }
    }
    async flushBuffer() {
        if (this.isProcessing || this.buffer.length === 0) {
            return;
        }
        this.isProcessing = true;
        const batchSize = this.config.database.poolSize;
        const batch = this.buffer.splice(0, batchSize);
        try {
            await this.databaseService.insertBatchReadings(batch);
            this.emit('flushedBuffer', {
                timestamp: new Date(),
                batchSize: batch.length,
                remainingBuffer: this.buffer.length
            });
        }
        catch (error) {
            // Put failed readings back in buffer
            this.buffer.unshift(...batch);
            throw error;
        }
        finally {
            this.isProcessing = false;
        }
    }
    async handleProcessingError(error) {
        const errorType = this.determineErrorType(error);
        const errorConfig = this.config.errorHandling.errorTypes[errorType];
        if (!errorConfig) {
            console.error('Unhandled error type:', errorType, error);
            return;
        }
        switch (errorConfig.recoveryStrategy) {
            case 'RECONNECT':
                await this.handleReconnection(errorConfig.maxAttempts || 1);
                break;
            case 'SKIP':
                // Log and continue
                console.warn('Skipping failed operation:', error);
                break;
            case 'RESET':
                await this.handleReset();
                break;
            default:
                console.error('Unknown recovery strategy:', errorConfig.recoveryStrategy);
        }
    }
    determineErrorType(error) {
        if (error.name === 'ValidationError')
            return 'VALIDATION_ERROR';
        if (error.code?.startsWith('28'))
            return 'DATABASE_ERROR'; // PostgreSQL connection error
        if (error.message?.includes('simulation'))
            return 'SIMULATOR_ERROR';
        return 'UNKNOWN_ERROR';
    }
    async handleReconnection(maxAttempts) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.databaseService.reconnect();
                console.log('Successfully reconnected to database');
                return;
            }
            catch (error) {
                console.error(`Reconnection attempt ${attempt}/${maxAttempts} failed:`, error);
                if (attempt === maxAttempts) {
                    this.emit('error', {
                        type: 'RECONNECTION_FAILED',
                        message: 'Max reconnection attempts reached',
                        error
                    });
                }
                await new Promise(resolve => setTimeout(resolve, this.config.errorHandling.retryDelay));
            }
        }
    }
    async handleReset() {
        this.stop();
        this.buffer = [];
        this.isProcessing = false;
        await this.start();
    }
    getServiceStatus() {
        return {
            isRunning: !this.isProcessing,
            bufferSize: this.buffer.length,
            simulatorStatus: this.meterSimulator.getSimulatorStatus(),
            databaseConnected: this.databaseService.isConnectionActive()
        };
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        if (config.database) {
            // Database config changes require service restart
            this.stop();
            this.databaseService = new DatabaseService_1.DatabaseService(this.config.database);
            this.start();
        }
        if (config.simulator) {
            this.meterSimulator.updateConfig(config.simulator);
        }
        if (config.validation) {
            this.dataValidator.updateConfig(config.validation);
        }
    }
}
exports.DataInjectionService = DataInjectionService;
