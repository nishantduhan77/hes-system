"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.defaultConfig = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'meter_data',
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || '',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
        timeout: parseInt(process.env.DB_TIMEOUT || '5000'),
        ssl: process.env.DB_SSL === 'true'
    },
    simulator: {
        simulationSpeed: parseInt(process.env.SIMULATION_SPEED || '1'),
        meterCount: parseInt(process.env.METER_COUNT || '10'),
        dataGenerationRate: process.env.DATA_GENERATION_RATE || 'REAL_TIME'
    },
    validation: {
        validateDataQuality: true,
        qualityThresholds: {
            voltage: {
                min: 210,
                max: 240,
                unit: 'V'
            },
            current: {
                min: 0,
                max: 100,
                unit: 'A'
            },
            power: {
                min: 0,
                max: 25000,
                unit: 'W'
            },
            frequency: {
                min: 49.5,
                max: 50.5,
                unit: 'Hz'
            }
        }
    },
    errorHandling: {
        maxRetries: 3,
        retryDelay: 1000,
        errorNotificationLevel: 'HIGH',
        errorTypes: {
            DATABASE_ERROR: {
                recoveryStrategy: 'RECONNECT',
                maxAttempts: 5
            },
            VALIDATION_ERROR: {
                recoveryStrategy: 'SKIP',
                logLevel: 'WARNING'
            },
            SIMULATOR_ERROR: {
                recoveryStrategy: 'RESET',
                notifyAdmin: true
            }
        }
    }
};
