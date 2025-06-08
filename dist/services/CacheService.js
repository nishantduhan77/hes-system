"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class CacheService {
    constructor(config) {
        this.config = config;
        this.redis = new ioredis_1.default({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db || 0,
            keyPrefix: config.keyPrefix || 'meter:'
        });
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.redis.on('error', (error) => {
            console.error('Redis error:', error);
        });
        this.redis.on('connect', () => {
            console.log('Connected to Redis');
        });
    }
    async cacheReading(reading) {
        const key = `${reading.meterId}:latest`;
        try {
            await this.redis.setex(key, this.config.ttl, JSON.stringify(reading));
        }
        catch (error) {
            console.error('Error caching reading:', error);
            throw error;
        }
    }
    async cacheBatchReadings(readings) {
        const pipeline = this.redis.pipeline();
        readings.forEach(reading => {
            const key = `${reading.meterId}:latest`;
            pipeline.setex(key, this.config.ttl, JSON.stringify(reading));
        });
        try {
            await pipeline.exec();
        }
        catch (error) {
            console.error('Error caching batch readings:', error);
            throw error;
        }
    }
    async getLatestReading(meterId) {
        const key = `${meterId}:latest`;
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Error getting latest reading:', error);
            throw error;
        }
    }
    async getMultipleReadings(meterIds) {
        const pipeline = this.redis.pipeline();
        meterIds.forEach(meterId => {
            const key = `${meterId}:latest`;
            pipeline.get(key);
        });
        try {
            const results = await pipeline.exec();
            return results.map(([error, data]) => {
                if (error) {
                    console.error('Error in multi-get:', error);
                    return null;
                }
                return data ? JSON.parse(data) : null;
            });
        }
        catch (error) {
            console.error('Error getting multiple readings:', error);
            throw error;
        }
    }
    async cacheAggregatedData(meterId, period, timestamp, data) {
        const key = `${meterId}:${period}:${timestamp.toISOString()}`;
        try {
            await this.redis.setex(key, this.config.ttl, JSON.stringify(data));
        }
        catch (error) {
            console.error('Error caching aggregated data:', error);
            throw error;
        }
    }
    async getAggregatedData(meterId, period, timestamp) {
        const key = `${meterId}:${period}:${timestamp.toISOString()}`;
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Error getting aggregated data:', error);
            throw error;
        }
    }
    async invalidateCache(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error('Error invalidating cache:', error);
            throw error;
        }
    }
    async disconnect() {
        await this.redis.quit();
    }
}
exports.CacheService = CacheService;
