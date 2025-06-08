"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestError = exports.ConfigurationError = exports.ValidationError = exports.DatabaseError = exports.CacheError = exports.MessageBrokerError = exports.MeterServiceError = void 0;
class MeterServiceError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'MeterServiceError';
    }
}
exports.MeterServiceError = MeterServiceError;
class MessageBrokerError extends MeterServiceError {
    constructor(message, details) {
        super(message, 'MESSAGE_BROKER_ERROR', details);
        this.name = 'MessageBrokerError';
    }
}
exports.MessageBrokerError = MessageBrokerError;
class CacheError extends MeterServiceError {
    constructor(message, details) {
        super(message, 'CACHE_ERROR', details);
        this.name = 'CacheError';
    }
}
exports.CacheError = CacheError;
class DatabaseError extends MeterServiceError {
    constructor(message, details) {
        super(message, 'DATABASE_ERROR', details);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class ValidationError extends MeterServiceError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ConfigurationError extends MeterServiceError {
    constructor(message, details) {
        super(message, 'CONFIGURATION_ERROR', details);
        this.name = 'ConfigurationError';
    }
}
exports.ConfigurationError = ConfigurationError;
class IngestError extends MeterServiceError {
    constructor(message, details) {
        super(message, 'INGEST_ERROR', details);
        this.name = 'IngestError';
    }
}
exports.IngestError = IngestError;
