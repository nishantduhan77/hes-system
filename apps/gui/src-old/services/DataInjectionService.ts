import { DatabaseService } from './DatabaseService';
import { MeterSimulator } from './MeterSimulator';
import { DataValidator } from './DataValidator';
import { MeterReading } from '../types/meter';
import { DataInjectionConfig, defaultConfig } from '../config/data-injection.config';
import EventEmitter from 'events';

export class DataInjectionService extends EventEmitter {
    private databaseService: DatabaseService;
    private meterSimulator: MeterSimulator;
    private dataValidator: DataValidator;
    private config: DataInjectionConfig;
    private buffer: MeterReading[] = [];
    private isProcessing: boolean = false;

    constructor(config: DataInjectionConfig = defaultConfig) {
        super();
        this.config = config;
        this.databaseService = new DatabaseService(config.database);
        this.meterSimulator = new MeterSimulator(config.simulator);
        this.dataValidator = new DataValidator(config.validation);
    }

    public async start(): Promise<void> {
        try {
            // Start the simulation with the processing callback
            await this.meterSimulator.startSimulation(async (readings) => {
                await this.processReadings(readings);
            });

            this.emit('started', {
                timestamp: new Date(),
                config: this.getServiceStatus()
            });
        } catch (error) {
            this.emit('error', {
                type: 'START_ERROR',
                message: 'Failed to start data injection service',
                error
            });
            throw error;
        }
    }

    public stop(): void {
        this.meterSimulator.stopSimulation();
        this.emit('stopped', {
            timestamp: new Date(),
            remainingBufferSize: this.buffer.length
        });
    }

    private async processReadings(readings: MeterReading[]): Promise<void> {
        try {
            // Validate the readings
            const validatedReadings = await this.dataValidator.validateBatchReadings(readings);

            // Add to buffer
            this.buffer.push(...validatedReadings);

            // Process buffer if it reaches batch size
            if (this.buffer.length >= this.config.database.poolSize!) {
                await this.flushBuffer();
            }

            // Emit processing stats
            const stats = this.dataValidator.getValidationStats(validatedReadings);
            this.emit('processedBatch', {
                timestamp: new Date(),
                stats
            });
        } catch (error) {
            this.emit('error', {
                type: 'PROCESSING_ERROR',
                message: 'Error processing readings',
                error
            });

            // Handle error based on configuration
            await this.handleProcessingError(error);
        }
    }

    private async flushBuffer(): Promise<void> {
        if (this.isProcessing || this.buffer.length === 0) {
            return;
        }

        this.isProcessing = true;
        const batchSize = this.config.database.poolSize!;
        const batch = this.buffer.splice(0, batchSize);

        try {
            await this.databaseService.insertBatchReadings(batch);
            
            this.emit('flushedBuffer', {
                timestamp: new Date(),
                batchSize: batch.length,
                remainingBuffer: this.buffer.length
            });
        } catch (error) {
            // Put failed readings back in buffer
            this.buffer.unshift(...batch);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    private async handleProcessingError(error: any): Promise<void> {
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

    private determineErrorType(error: any): string {
        if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
        if (error.code?.startsWith('28')) return 'DATABASE_ERROR'; // PostgreSQL connection error
        if (error.message?.includes('simulation')) return 'SIMULATOR_ERROR';
        return 'UNKNOWN_ERROR';
    }

    private async handleReconnection(maxAttempts: number): Promise<void> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.databaseService.reconnect();
                console.log('Successfully reconnected to database');
                return;
            } catch (error) {
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

    private async handleReset(): Promise<void> {
        this.stop();
        this.buffer = [];
        this.isProcessing = false;
        await this.start();
    }

    public getServiceStatus(): {
        isRunning: boolean;
        bufferSize: number;
        simulatorStatus: ReturnType<typeof MeterSimulator.prototype.getSimulatorStatus>;
        databaseConnected: boolean;
    } {
        return {
            isRunning: !this.isProcessing,
            bufferSize: this.buffer.length,
            simulatorStatus: this.meterSimulator.getSimulatorStatus(),
            databaseConnected: this.databaseService.isConnectionActive()
        };
    }

    public updateConfig(config: Partial<DataInjectionConfig>): void {
        this.config = { ...this.config, ...config };
        
        if (config.database) {
            // Database config changes require service restart
            this.stop();
            this.databaseService = new DatabaseService(this.config.database);
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