import { Pool, PoolConfig, QueryResult } from 'pg';
import { MeterReading, MeterAlarm } from '../types/meter';
import { DatabaseConfig } from '../config/data-injection.config';

export class DatabaseService {
    private pool: Pool;
    private isConnected: boolean = false;

    constructor(config: DatabaseConfig) {
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            max: config.poolSize,
            idleTimeoutMillis: config.timeout,
            ssl: config.ssl
        });

        this.initializeConnection();
    }

    private async initializeConnection(): Promise<void> {
        try {
            const client = await this.pool.connect();
            client.release();
            this.isConnected = true;
            console.log('Database connection established successfully');
        } catch (error) {
            console.error('Failed to establish database connection:', error);
            throw error;
        }
    }

    public async insertMeterReading(reading: MeterReading): Promise<void> {
        const query = `
            INSERT INTO meter_readings (
                meter_id, timestamp, voltage, current, power, 
                frequency, energy_consumption, connection_status, quality
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        const values = [
            reading.meterId,
            reading.timestamp,
            reading.readings.voltage,
            reading.readings.current,
            reading.readings.power,
            reading.readings.frequency,
            reading.readings.energyConsumption,
            reading.status.connectionStatus,
            reading.status.quality
        ];

        try {
            await this.pool.query(query, values);
        } catch (error) {
            console.error('Error inserting meter reading:', error);
            throw error;
        }
    }

    public async insertMeterAlarm(alarm: MeterAlarm): Promise<void> {
        const query = `
            INSERT INTO meter_alarms (
                meter_id, timestamp, alarm_type, alarm_message, status
            ) VALUES ($1, $2, $3, $4, $5)
        `;

        const values = [
            alarm.meterId,
            alarm.timestamp,
            alarm.alarmType,
            alarm.message,
            alarm.status
        ];

        try {
            await this.pool.query(query, values);
        } catch (error) {
            console.error('Error inserting meter alarm:', error);
            throw error;
        }
    }

    public async insertBatchReadings(readings: MeterReading[]): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            for (const reading of readings) {
                await this.insertMeterReading(reading);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error inserting batch readings:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async getMeterReadings(meterId: string, startTime: Date, endTime: Date): Promise<MeterReading[]> {
        const query = `
            SELECT * FROM meter_readings 
            WHERE meter_id = $1 
            AND timestamp BETWEEN $2 AND $3 
            ORDER BY timestamp DESC
        `;

        try {
            const result = await this.pool.query(query, [meterId, startTime, endTime]);
            return result.rows.map(this.mapRowToMeterReading);
        } catch (error) {
            console.error('Error fetching meter readings:', error);
            throw error;
        }
    }

    private mapRowToMeterReading(row: any): MeterReading {
        return {
            meterId: row.meter_id,
            timestamp: row.timestamp,
            readings: {
                voltage: row.voltage,
                current: row.current,
                power: row.power,
                frequency: row.frequency,
                energyConsumption: row.energy_consumption
            },
            status: {
                connectionStatus: row.connection_status,
                quality: row.quality
            }
        };
    }

    public async disconnect(): Promise<void> {
        await this.pool.end();
        this.isConnected = false;
    }

    public async reconnect(): Promise<void> {
        if (!this.isConnected) {
            await this.initializeConnection();
        }
    }

    public isConnectionActive(): boolean {
        return this.isConnected;
    }
} 