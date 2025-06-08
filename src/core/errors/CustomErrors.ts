export class MeterServiceError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'MeterServiceError';
    }
}

export class MessageBrokerError extends MeterServiceError {
    constructor(message: string, details?: any) {
        super(message, 'MESSAGE_BROKER_ERROR', details);
        this.name = 'MessageBrokerError';
    }
}

export class CacheError extends MeterServiceError {
    constructor(message: string, details?: any) {
        super(message, 'CACHE_ERROR', details);
        this.name = 'CacheError';
    }
}

export class DatabaseError extends MeterServiceError {
    constructor(message: string, details?: any) {
        super(message, 'DATABASE_ERROR', details);
        this.name = 'DatabaseError';
    }
}

export class ValidationError extends MeterServiceError {
    constructor(message: string, details?: any) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export class ConfigurationError extends MeterServiceError {
    constructor(message: string, details?: any) {
        super(message, 'CONFIGURATION_ERROR', details);
        this.name = 'ConfigurationError';
    }
}

export class IngestError extends MeterServiceError {
    constructor(message: string, details?: any) {
        super(message, 'INGEST_ERROR', details);
        this.name = 'IngestError';
    }
} 