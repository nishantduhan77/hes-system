"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.defaultConfig = {
    messageBroker: {
        mqtt: {
            url: process.env.MQTT_URL || 'mqtt://localhost:1883',
            clientId: `meter-service-${Math.random().toString(16).slice(2)}`,
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
            topics: ['meters/+/readings', 'meters/+/status']
        },
        kafka: {
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
            clientId: 'meter-service',
            topic: 'meter-readings',
            groupId: 'meter-service-group'
        }
    },
    cache: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: 'meter:',
        ttl: parseInt(process.env.REDIS_TTL || '3600') // 1 hour default
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'meter_data',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
        timeout: parseInt(process.env.DB_TIMEOUT || '5000'),
        ssl: process.env.DB_SSL === 'true'
    },
    ingest: {
        batchSize: parseInt(process.env.INGEST_BATCH_SIZE || '100'),
        flushInterval: parseInt(process.env.INGEST_FLUSH_INTERVAL || '5000'),
        enableCache: process.env.ENABLE_CACHE !== 'false'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        console: process.env.LOG_CONSOLE !== 'false',
        filename: process.env.LOG_FILE || 'logs/service.log'
    }
};
