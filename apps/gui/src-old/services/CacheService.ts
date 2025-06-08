import Redis from 'ioredis';
import { MeterReading } from '../types/meter';

export interface CacheConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    ttl: number; // Time to live in seconds
}

export class CacheService {
    private redis: Redis;
    private config: CacheConfig;

    constructor(config: CacheConfig) {
        this.config = config;
        this.redis = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db || 0,
            keyPrefix: config.keyPrefix || 'meter:'
        });

        this.setupErrorHandling();
    }

    private setupErrorHandling(): void {
        this.redis.on('error', (error) => {
            console.error('Redis error:', error);
        });

        this.redis.on('connect', () => {
            console.log('Connected to Redis');
        });
    }

    public async cacheReading(reading: MeterReading): Promise<void> {
        const key = `${reading.meterId}:latest`;
        try {
            await this.redis.setex(
                key,
                this.config.ttl,
                JSON.stringify(reading)
            );
        } catch (error) {
            console.error('Error caching reading:', error);
            throw error;
        }
    }

    public async cacheBatchReadings(readings: MeterReading[]): Promise<void> {
        const pipeline = this.redis.pipeline();
        
        readings.forEach(reading => {
            const key = `${reading.meterId}:latest`;
            pipeline.setex(
                key,
                this.config.ttl,
                JSON.stringify(reading)
            );
        });

        try {
            await pipeline.exec();
        } catch (error) {
            console.error('Error caching batch readings:', error);
            throw error;
        }
    }

    public async getLatestReading(meterId: string): Promise<MeterReading | null> {
        const key = `${meterId}:latest`;
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting latest reading:', error);
            throw error;
        }
    }

    public async getMultipleReadings(meterIds: string[]): Promise<(MeterReading | null)[]> {
        const pipeline = this.redis.pipeline();
        
        meterIds.forEach(meterId => {
            const key = `${meterId}:latest`;
            pipeline.get(key);
        });

        try {
            const results = await pipeline.exec();
            return results!.map(([error, data]) => {
                if (error) {
                    console.error('Error in multi-get:', error);
                    return null;
                }
                return data ? JSON.parse(data as string) : null;
            });
        } catch (error) {
            console.error('Error getting multiple readings:', error);
            throw error;
        }
    }

    public async cacheAggregatedData(
        meterId: string,
        period: 'hourly' | 'daily',
        timestamp: Date,
        data: any
    ): Promise<void> {
        const key = `${meterId}:${period}:${timestamp.toISOString()}`;
        try {
            await this.redis.setex(
                key,
                this.config.ttl,
                JSON.stringify(data)
            );
        } catch (error) {
            console.error('Error caching aggregated data:', error);
            throw error;
        }
    }

    public async getAggregatedData(
        meterId: string,
        period: 'hourly' | 'daily',
        timestamp: Date
    ): Promise<any | null> {
        const key = `${meterId}:${period}:${timestamp.toISOString()}`;
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting aggregated data:', error);
            throw error;
        }
    }

    public async invalidateCache(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error('Error invalidating cache:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        await this.redis.quit();
    }
} 