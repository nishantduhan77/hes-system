"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DLMSSimulatorService = void 0;
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const ObisCode_1 = require("../core/dlms/ObisCode");
class DLMSSimulatorService {
    constructor() {
        this.simulatedMeters = new Map();
        this.simulationIntervals = new Map();
        this.pool = new pg_1.Pool({
            user: 'hes_user',
            host: 'localhost',
            database: 'hes_db',
            password: 'hes_password',
            port: 5433,
        });
        // Initialize OBIS codes for different measurements
        this.obisCodes = {
            ACTIVE_POWER_IMPORT: new ObisCode_1.ObisCode(1, 0, 1, 7, 0, 255),
            ACTIVE_POWER_EXPORT: new ObisCode_1.ObisCode(1, 0, 2, 7, 0, 255),
            VOLTAGE_R_PHASE: new ObisCode_1.ObisCode(1, 0, 32, 7, 0, 255),
            CURRENT_R_PHASE: new ObisCode_1.ObisCode(1, 0, 31, 7, 0, 255)
        };
        // Generate initial set of meters
        this.generateInitialMeters();
    }
    async generateInitialMeters() {
        const manufacturers = ['L&T', 'Secure Meters', 'Genus', 'HPL', 'Elmeasure', 'Duke Meters'];
        const models = ['Elite 300', 'Smart 100', 'Pro 200', 'Advanced 400'];
        const states = ['MH', 'DL', 'KA', 'TN', 'GJ', 'UP', 'MP', 'RJ'];
        try {
            // Clear existing meters
            await this.pool.query('DELETE FROM meters');
            await this.pool.query('DELETE FROM power_readings');
            // Generate 10 meters
            for (let i = 0; i < 10; i++) {
                const serialPrefix = states[Math.floor(Math.random() * states.length)];
                const serialNumber = `${serialPrefix}${String(i + 1).padStart(8, '0')}`;
                const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
                const model = models[Math.floor(Math.random() * models.length)];
                await this.addMeter(serialNumber, manufacturer, model);
            }
        }
        catch (error) {
            console.error('Error generating initial meters:', error);
        }
    }
    static getInstance() {
        if (!DLMSSimulatorService.instance) {
            DLMSSimulatorService.instance = new DLMSSimulatorService();
        }
        return DLMSSimulatorService.instance;
    }
    async addMeter(serialNumber, manufacturer = 'Secure', model = 'Elite') {
        const meterId = (0, uuid_1.v4)();
        const meter = {
            meterId,
            serialNumber,
            manufacturer,
            model,
            firmwareVersion: '1.0.0',
            status: 'DISCONNECTED',
            lastCommunication: new Date()
        };
        try {
            await this.pool.query('INSERT INTO meters (meter_id, serial_number, manufacturer, model, installation_date, firmware_version, status, last_communication) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [meterId, serialNumber, manufacturer, model, new Date(), '1.0.0', 'DISCONNECTED', new Date()]);
            this.simulatedMeters.set(meterId, meter);
            return meterId;
        }
        catch (error) {
            console.error('Error adding meter:', error);
            throw error;
        }
    }
    generateRealisticValue(min, max) {
        return min + Math.random() * (max - min);
    }
    async startSimulation(meterId) {
        const meter = this.simulatedMeters.get(meterId);
        if (!meter) {
            throw new Error('Meter not found');
        }
        // Update meter status
        meter.status = 'CONNECTED';
        await this.pool.query('UPDATE meters SET status = $1, last_communication = $2 WHERE meter_id = $3', ['CONNECTED', new Date(), meterId]);
        // Start generating readings every 5 seconds
        const interval = setInterval(async () => {
            try {
                const timestamp = new Date();
                const readings = {
                    active_power_import: this.generateRealisticValue(200, 2000), // 200W to 2kW
                    active_power_export: this.generateRealisticValue(0, 500), // 0W to 500W
                    voltage_r_phase: this.generateRealisticValue(220, 240), // 220V to 240V
                    current_r_phase: this.generateRealisticValue(1, 10) // 1A to 10A
                };
                await this.pool.query('INSERT INTO power_readings (meter_id, timestamp, active_power_import, active_power_export, voltage_r_phase, current_r_phase, quality_code) VALUES ($1, $2, $3, $4, $5, $6, $7)', [meterId, timestamp, readings.active_power_import, readings.active_power_export, readings.voltage_r_phase, readings.current_r_phase, 0]);
                // Update last communication time
                meter.lastCommunication = timestamp;
                await this.pool.query('UPDATE meters SET last_communication = $1 WHERE meter_id = $2', [timestamp, meterId]);
            }
            catch (error) {
                console.error('Error generating readings:', error);
            }
        }, 5000);
        this.simulationIntervals.set(meterId, interval);
    }
    async stopSimulation(meterId) {
        const interval = this.simulationIntervals.get(meterId);
        if (interval) {
            clearInterval(interval);
            this.simulationIntervals.delete(meterId);
        }
        const meter = this.simulatedMeters.get(meterId);
        if (meter) {
            meter.status = 'DISCONNECTED';
            await this.pool.query('UPDATE meters SET status = $1 WHERE meter_id = $2', ['DISCONNECTED', meterId]);
        }
    }
    async cleanup() {
        // Stop all simulations
        for (const [meterId, interval] of this.simulationIntervals) {
            clearInterval(interval);
            await this.stopSimulation(meterId);
        }
        // Close database connection
        await this.pool.end();
    }
}
exports.DLMSSimulatorService = DLMSSimulatorService;
