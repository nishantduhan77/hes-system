import { IngestService } from '../services/IngestService';
import { MessageBrokerService } from '../services/MessageBrokerService';
import { CacheService } from '../services/CacheService';
import { DatabaseService } from '../services/DatabaseService';
import { MeterReading } from '../types/meter';
import { IngestError } from '../core/errors/CustomErrors';

jest.mock('../services/MessageBrokerService');
jest.mock('../services/CacheService');
jest.mock('../services/DatabaseService');

describe('IngestService', () => {
    let ingestService: IngestService;
    let messageBroker: jest.Mocked<MessageBrokerService>;
    let cacheService: jest.Mocked<CacheService>;
    let databaseService: jest.Mocked<DatabaseService>;

    const mockConfig = {
        batchSize: 2,
        flushInterval: 1000,
        enableCache: true
    };

    const mockReading: MeterReading = {
        meterId: 'test-meter-1',
        timestamp: new Date(),
        value: 100,
        unit: 'kWh',
        quality: 'GOOD'
    };

    beforeEach(() => {
        messageBroker = new MessageBrokerService({} as any) as jest.Mocked<MessageBrokerService>;
        cacheService = new CacheService({} as any) as jest.Mocked<CacheService>;
        databaseService = new DatabaseService({} as any) as jest.Mocked<DatabaseService>;

        ingestService = new IngestService(
            messageBroker,
            cacheService,
            databaseService,
            mockConfig
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('ingestReading', () => {
        it('should process single reading successfully', async () => {
            cacheService.cacheReading.mockResolvedValueOnce();

            await ingestService.ingestReading(mockReading);

            expect(cacheService.cacheReading).toHaveBeenCalledWith(mockReading);
        });

        it('should handle cache error gracefully', async () => {
            const error = new Error('Cache error');
            cacheService.cacheReading.mockRejectedValueOnce(error);

            await expect(ingestService.ingestReading(mockReading))
                .rejects
                .toThrow(IngestError);
        });

        it('should flush buffer when batch size is reached', async () => {
            databaseService.insertBatchReadings.mockResolvedValueOnce();

            await ingestService.ingestReading(mockReading);
            await ingestService.ingestReading(mockReading);

            expect(databaseService.insertBatchReadings).toHaveBeenCalledTimes(1);
        });
    });

    describe('ingestBatch', () => {
        const mockBatch = [mockReading, { ...mockReading, meterId: 'test-meter-2' }];

        it('should process batch successfully', async () => {
            cacheService.cacheBatchReadings.mockResolvedValueOnce();
            databaseService.insertBatchReadings.mockResolvedValueOnce();

            await ingestService.ingestBatch(mockBatch);

            expect(cacheService.cacheBatchReadings).toHaveBeenCalledWith(mockBatch);
            expect(databaseService.insertBatchReadings).toHaveBeenCalled();
        });

        it('should handle database error during batch flush', async () => {
            const error = new Error('Database error');
            databaseService.insertBatchReadings.mockRejectedValueOnce(error);

            await expect(ingestService.ingestBatch(mockBatch))
                .rejects
                .toThrow(IngestError);
        });
    });

    describe('getLatestReading', () => {
        it('should return cached reading if available', async () => {
            cacheService.getLatestReading.mockResolvedValueOnce(mockReading);

            const result = await ingestService.getLatestReading('test-meter-1');

            expect(result).toEqual(mockReading);
            expect(databaseService.getMeterReadings).not.toHaveBeenCalled();
        });

        it('should fallback to database if cache miss', async () => {
            cacheService.getLatestReading.mockResolvedValueOnce(null);
            databaseService.getMeterReadings.mockResolvedValueOnce([mockReading]);

            const result = await ingestService.getLatestReading('test-meter-1');

            expect(result).toEqual(mockReading);
            expect(databaseService.getMeterReadings).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should emit error events', (done) => {
            const error = new Error('Test error');
            cacheService.cacheReading.mockRejectedValueOnce(error);

            ingestService.on('error', (errorEvent) => {
                expect(errorEvent.type).toBe('PROCESSING_ERROR');
                expect(errorEvent.error).toBe(error);
                done();
            });

            ingestService.ingestReading(mockReading);
        });

        it('should handle message broker errors', (done) => {
            messageBroker.emit('error', { type: 'MQTT_ERROR', error: new Error('MQTT error') });

            ingestService.on('error', (errorEvent) => {
                expect(errorEvent.type).toBe('MQTT_ERROR');
                done();
            });
        });
    });
}); 