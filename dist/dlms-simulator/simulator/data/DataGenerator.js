"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataGenerator = void 0;
const Types_1 = require("../../core/cosem/data/Types");
/**
 * Default configuration for Indian electricity meters
 */
const DEFAULT_CONFIG = {
    voltage: {
        nominal: 230,
        variation: 0.1 // ±10%
    },
    current: {
        nominal: 5,
        variation: 0.2 // ±20%
    },
    frequency: {
        nominal: 50,
        variation: 0.01 // ±1%
    },
    powerFactor: {
        nominal: 0.95,
        variation: 0.05 // ±5%
    }
};
/**
 * Generates realistic meter data based on Indian standards
 */
class DataGenerator {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.lastValues = new Map();
        this.timeOfDay = 0;
    }
    /**
     * Generate a random value within variation limits
     */
    generateValue(nominal, variation) {
        const min = nominal * (1 - variation);
        const max = nominal * (1 + variation);
        return min + Math.random() * (max - min);
    }
    /**
     * Apply time-based load pattern
     */
    getLoadFactor() {
        // Simulate typical daily load curve
        // Peak hours: 6-9 AM and 6-10 PM
        const hour = this.timeOfDay % 24;
        if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 22)) {
            return 1.2; // 20% higher during peak hours
        }
        else if (hour >= 23 || hour <= 5) {
            return 0.7; // 30% lower during night
        }
        return 1.0;
    }
    /**
     * Update time of day
     */
    updateTime(hour) {
        this.timeOfDay = hour;
    }
    /**
     * Generate voltage reading
     */
    getVoltage(phase = 1) {
        const key = `voltage_${phase}`;
        let value = this.lastValues.get(key) || this.config.voltage.nominal;
        // Small random variation
        value = this.generateValue(value, this.config.voltage.variation * 0.1);
        // Ensure within overall limits
        value = Math.max(this.config.voltage.nominal * (1 - this.config.voltage.variation), Math.min(this.config.voltage.nominal * (1 + this.config.voltage.variation), value));
        this.lastValues.set(key, value);
        return { scalar: value, unit: Types_1.Unit.VOLT };
    }
    /**
     * Generate current reading
     */
    getCurrent(phase = 1) {
        const loadFactor = this.getLoadFactor();
        const key = `current_${phase}`;
        let value = this.lastValues.get(key) || this.config.current.nominal;
        // Apply load pattern and random variation
        value = this.generateValue(value * loadFactor, this.config.current.variation * 0.1);
        // Ensure within overall limits
        value = Math.max(this.config.current.nominal * 0.1, // Minimum 10% of nominal
        Math.min(this.config.current.nominal * 1.5, value) // Maximum 150% of nominal
        );
        this.lastValues.set(key, value);
        return { scalar: value, unit: Types_1.Unit.AMPERE };
    }
    /**
     * Generate frequency reading
     */
    getFrequency() {
        const key = 'frequency';
        let value = this.lastValues.get(key) || this.config.frequency.nominal;
        // Small random variation
        value = this.generateValue(value, this.config.frequency.variation * 0.1);
        // Ensure within overall limits
        value = Math.max(this.config.frequency.nominal * (1 - this.config.frequency.variation), Math.min(this.config.frequency.nominal * (1 + this.config.frequency.variation), value));
        this.lastValues.set(key, value);
        return { scalar: value, unit: Types_1.Unit.HERTZ };
    }
    /**
     * Generate power factor reading
     */
    getPowerFactor(phase = 1) {
        const key = `pf_${phase}`;
        let value = this.lastValues.get(key) || this.config.powerFactor.nominal;
        // Small random variation
        value = this.generateValue(value, this.config.powerFactor.variation * 0.1);
        // Ensure within overall limits and between 0 and 1
        value = Math.max(0.7, // Minimum power factor
        Math.min(1.0, value));
        this.lastValues.set(key, value);
        return { scalar: value, unit: Types_1.Unit.NONE };
    }
    /**
     * Calculate active power
     */
    getActivePower(phase = 1) {
        const voltage = this.getVoltage(phase).scalar;
        const current = this.getCurrent(phase).scalar;
        const powerFactor = this.getPowerFactor(phase).scalar;
        const power = voltage * current * powerFactor;
        return { scalar: power, unit: Types_1.Unit.WATT };
    }
    /**
     * Calculate reactive power
     */
    getReactivePower(phase = 1) {
        const voltage = this.getVoltage(phase).scalar;
        const current = this.getCurrent(phase).scalar;
        const powerFactor = this.getPowerFactor(phase).scalar;
        const power = voltage * current * Math.sin(Math.acos(powerFactor));
        return { scalar: power, unit: Types_1.Unit.VAR };
    }
    /**
     * Calculate apparent power
     */
    getApparentPower(phase = 1) {
        const voltage = this.getVoltage(phase).scalar;
        const current = this.getCurrent(phase).scalar;
        const power = voltage * current;
        return { scalar: power, unit: Types_1.Unit.VOLT_AMPERE };
    }
}
exports.DataGenerator = DataGenerator;
