import { MessageBrokerService } from './MessageBrokerService';
import { CacheService } from './CacheService';
import { DatabaseService } from './DatabaseService';
import { MeterReading } from '../types/meter';
import EventEmitter from 'events';

export interface IngestConfig {
    batchSize: number;
    flushInterval: number;
    enableCache: boolean;
}

export class IngestService extends EventEmitter {
    private messageBroker: MessageBrokerService;
    private cacheService: CacheService;
    private databaseService: DatabaseService;
    private config: IngestConfig;
    private buffer: MeterReading[] = [];
    private flushTimer: NodeJS.Timeout | null = null;

    constructor(
        messageBroker: MessageBrokerService,
        cacheService: CacheService,
        databaseService: DatabaseService,
        config: IngestConfig
    ) {
        super();
        this.messageBroker = messageBroker;
        this.cacheService = cacheService;
        this.databaseService = databaseService;
        this.config = config;

        this.setupMessageHandlers();
        this.setupFlushInterval();
    }

    private setupMessageHandlers(): void {
        // Handle MQTT messages
        this.messageBroker.on('mqttMessage', async ({ topic, data }) => {
            try {
                await this.processReading(data as MeterReading);
            } catch (error) {
                console.error('Error processing MQTT message:', error);
                this.emit('error', { type: 'MQTT_PROCESSING_ERROR', error });
            }
        });

        // Handle Kafka messages
        this.messageBroker.on('kafkaMessage', async ({ topic, data }) => {
            try {
                await this.processReading(data as MeterReading);
            } catch (error) {
                console.error('Error processing Kafka message:', error);
                this.emit('error', { type: 'KAFKA_PROCESSING_ERROR', error });
            }
        });
    }

    private setupFlushInterval(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(
            () => this.flushBuffer(),
            this.config.flushInterval
        );
    }

    private async processReading(reading: MeterReading): Promise<void> {
        try {
            // Cache the reading if caching is enabled
            if (this.config.enableCache) {
                await this.cacheService.cacheReading(reading);
            }

            // Add to buffer
            this.buffer.push(reading);

            // Flush buffer if it reaches batch size
            if (this.buffer.length >= this.config.batchSize) {
                await this.flushBuffer();
            }

            this.emit('processed', {
                meterId: reading.meterId,
                timestamp: reading.timestamp
            });
        } catch (error) {
            console.error('Error processing reading:', error);
            this.emit('error', { type: 'PROCESSING_ERROR', error });
            throw error;
        }
    }

    private async flushBuffer(): Promise<void> {
        if (this.buffer.length === 0) return;

        const batchToFlush = [...this.buffer];
        this.buffer = [];

        try {
            // Store in TimescaleDB
            await this.databaseService.insertBatchReadings(batchToFlush);

            this.emit('flushed', {
                count: batchToFlush.length,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error flushing buffer:', error);
            // Put failed readings back in buffer
            this.buffer.unshift(...batchToFlush);
            this.emit('error', { type: 'FLUSH_ERROR', error });
            throw error;
        }
    }

    public async ingestReading(reading: MeterReading): Promise<void> {
        await this.processReading(reading);
    }

    public async ingestBatch(readings: MeterReading[]): Promise<void> {
        try {
            // Cache batch if enabled
            if (this.config.enableCache) {
                await this.cacheService.cacheBatchReadings(readings);
            }

            // Add to buffer
            this.buffer.push(...readings);

            // Flush if buffer exceeds batch size
            if (this.buffer.length >= this.config.batchSize) {
                await this.flushBuffer();
            }

            this.emit('batchProcessed', {
                count: readings.length,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error processing batch:', error);
            this.emit('error', { type: 'BATCH_PROCESSING_ERROR', error });
            throw error;
        }
    }

    public async getLatestReading(meterId: string): Promise<MeterReading | null> {
        try {
            // Try cache first if enabled
            if (this.config.enableCache) {
                const cached = await this.cacheService.getLatestReading(meterId);
                if (cached) return cached;
            }

            // Fall back to database
            const readings = await this.databaseService.getMeterReadings(
                meterId,
                new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                new Date()
            );

            return readings.length > 0 ? readings[0] : null;
        } catch (error) {
            console.error('Error getting latest reading:', error);
            this.emit('error', { type: 'FETCH_ERROR', error });
            throw error;
        }
    }

    public updateConfig(config: Partial<IngestConfig>): void {
        this.config = { ...this.config, ...config };
        this.setupFlushInterval();
    }

    public async stop(): Promise<void> {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        // Flush any remaining readings
        await this.flushBuffer();
    }
} 