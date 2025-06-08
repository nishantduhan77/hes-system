"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataValidator = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class DataValidator {
    constructor(config) {
        this.config = config;
    }
    async validateMeterData(reading) {
        if (!this.config.validateDataQuality) {
            return reading;
        }
        const errors = [];
        // Validate voltage
        if (!this.isInRange(reading.readings.voltage, this.config.qualityThresholds.voltage.min, this.config.qualityThresholds.voltage.max)) {
            errors.push(`Voltage ${reading.readings.voltage}${this.config.qualityThresholds.voltage.unit} is out of range`);
        }
        // Validate current
        if (!this.isInRange(reading.readings.current, this.config.qualityThresholds.current.min, this.config.qualityThresholds.current.max)) {
            errors.push(`Current ${reading.readings.current}${this.config.qualityThresholds.current.unit} is out of range`);
        }
        // Validate power
        if (!this.isInRange(reading.readings.power, this.config.qualityThresholds.power.min, this.config.qualityThresholds.power.max)) {
            errors.push(`Power ${reading.readings.power}${this.config.qualityThresholds.power.unit} is out of range`);
        }
        // Validate frequency
        if (!this.isInRange(reading.readings.frequency, this.config.qualityThresholds.frequency.min, this.config.qualityThresholds.frequency.max)) {
            errors.push(`Frequency ${reading.readings.frequency}${this.config.qualityThresholds.frequency.unit} is out of range`);
        }
        // Update quality status based on validation results
        if (errors.length > 0) {
            reading.status.quality = errors.length > 2 ? 'BAD' : 'QUESTIONABLE';
            console.warn(`Validation warnings for meter ${reading.meterId}:`, errors);
        }
        return reading;
    }
    async validateBatchReadings(readings) {
        return Promise.all(readings.map(reading => this.validateMeterData(reading)));
    }
    isInRange(value, min, max) {
        return value >= min && value <= max;
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    getValidationStats(readings) {
        return readings.reduce((stats, reading) => {
            stats.totalReadings++;
            switch (reading.status.quality) {
                case 'GOOD':
                    stats.goodQuality++;
                    break;
                case 'QUESTIONABLE':
                    stats.questionableQuality++;
                    break;
                case 'BAD':
                    stats.badQuality++;
                    break;
            }
            return stats;
        }, {
            totalReadings: 0,
            goodQuality: 0,
            questionableQuality: 0,
            badQuality: 0
        });
    }
}
exports.DataValidator = DataValidator;
