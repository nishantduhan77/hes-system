"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const pg_1 = require("pg");
class DatabaseService {
    constructor(config) {
        this.isConnected = false;
        this.pool = new pg_1.Pool({
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
    async initializeConnection() {
        try {
            const client = await this.pool.connect();
            client.release();
            this.isConnected = true;
            console.log('Database connection established successfully');
        }
        catch (error) {
            console.error('Failed to establish database connection:', error);
            throw error;
        }
    }
    async insertMeterReading(reading) {
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
        }
        catch (error) {
            console.error('Error inserting meter reading:', error);
            throw error;
        }
    }
    async insertMeterAlarm(alarm) {
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
        }
        catch (error) {
            console.error('Error inserting meter alarm:', error);
            throw error;
        }
    }
    async insertBatchReadings(readings) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            for (const reading of readings) {
                await this.insertMeterReading(reading);
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Error inserting batch readings:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getMeterReadings(meterId, startTime, endTime) {
        const query = `
            SELECT * FROM meter_readings 
            WHERE meter_id = $1 
            AND timestamp BETWEEN $2 AND $3 
            ORDER BY timestamp DESC
        `;
        try {
            const result = await this.pool.query(query, [meterId, startTime, endTime]);
            return result.rows.map(this.mapRowToMeterReading);
        }
        catch (error) {
            console.error('Error fetching meter readings:', error);
            throw error;
        }
    }
    mapRowToMeterReading(row) {
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
    async disconnect() {
        await this.pool.end();
        this.isConnected = false;
    }
    async reconnect() {
        if (!this.isConnected) {
            await this.initializeConnection();
        }
    }
    isConnectionActive() {
        return this.isConnected;
    }
}
exports.DatabaseService = DatabaseService;
