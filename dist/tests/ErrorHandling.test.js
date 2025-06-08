"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomErrors_1 = require("../core/errors/CustomErrors");
describe('Custom Error Classes', () => {
    describe('MeterServiceError', () => {
        it('should create base error with code and details', () => {
            const error = new CustomErrors_1.MeterServiceError('Test error', 'TEST_ERROR', { foo: 'bar' });
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_ERROR');
            expect(error.details).toEqual({ foo: 'bar' });
            expect(error.name).toBe('MeterServiceError');
        });
        it('should work without details', () => {
            const error = new CustomErrors_1.MeterServiceError('Test error', 'TEST_ERROR');
            expect(error.details).toBeUndefined();
        });
    });
    describe('MessageBrokerError', () => {
        it('should create error with correct code and name', () => {
            const error = new CustomErrors_1.MessageBrokerError('MQTT connection failed');
            expect(error.code).toBe('MESSAGE_BROKER_ERROR');
            expect(error.name).toBe('MessageBrokerError');
            expect(error.message).toBe('MQTT connection failed');
        });
        it('should include details when provided', () => {
            const details = { host: 'localhost', port: 1883 };
            const error = new CustomErrors_1.MessageBrokerError('Connection failed', details);
            expect(error.details).toEqual(details);
        });
    });
    describe('CacheError', () => {
        it('should create error with correct code and name', () => {
            const error = new CustomErrors_1.CacheError('Redis connection failed');
            expect(error.code).toBe('CACHE_ERROR');
            expect(error.name).toBe('CacheError');
        });
    });
    describe('DatabaseError', () => {
        it('should create error with correct code and name', () => {
            const error = new CustomErrors_1.DatabaseError('Database query failed');
            expect(error.code).toBe('DATABASE_ERROR');
            expect(error.name).toBe('DatabaseError');
        });
    });
    describe('ValidationError', () => {
        it('should create error with correct code and name', () => {
            const error = new CustomErrors_1.ValidationError('Invalid meter reading format');
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.name).toBe('ValidationError');
        });
        it('should include validation details', () => {
            const details = {
                field: 'meterId',
                value: null,
                constraint: 'required'
            };
            const error = new CustomErrors_1.ValidationError('Invalid meter ID', details);
            expect(error.details).toEqual(details);
        });
    });
    describe('ConfigurationError', () => {
        it('should create error with correct code and name', () => {
            const error = new CustomErrors_1.ConfigurationError('Missing required config');
            expect(error.code).toBe('CONFIGURATION_ERROR');
            expect(error.name).toBe('ConfigurationError');
        });
    });
    describe('IngestError', () => {
        it('should create error with correct code and name', () => {
            const error = new CustomErrors_1.IngestError('Failed to process reading');
            expect(error.code).toBe('INGEST_ERROR');
            expect(error.name).toBe('IngestError');
        });
        it('should include processing details', () => {
            const details = {
                meterId: 'meter-1',
                timestamp: new Date(),
                stage: 'validation'
            };
            const error = new CustomErrors_1.IngestError('Processing failed', details);
            expect(error.details).toEqual(details);
        });
    });
    describe('Error Inheritance', () => {
        it('should maintain proper inheritance chain', () => {
            const error = new CustomErrors_1.MessageBrokerError('Test error');
            expect(error instanceof Error).toBeTruthy();
            expect(error instanceof CustomErrors_1.MeterServiceError).toBeTruthy();
            expect(error instanceof CustomErrors_1.MessageBrokerError).toBeTruthy();
        });
        it('should allow catching as base error type', () => {
            try {
                throw new CustomErrors_1.DatabaseError('DB Error');
            }
            catch (error) {
                expect(error instanceof CustomErrors_1.MeterServiceError).toBeTruthy();
                expect(error.code).toBe('DATABASE_ERROR');
            }
        });
    });
});
