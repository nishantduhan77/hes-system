import { ScalarUnit, Unit } from '../../core/cosem/data/Types';

/**
 * Configuration for data generation
 */
export interface DataGeneratorConfig {
    voltage: {
        nominal: number;
        variation: number;
    };
    current: {
        nominal: number;
        variation: number;
    };
    frequency: {
        nominal: number;
        variation: number;
    };
    powerFactor: {
        nominal: number;
        variation: number;
    };
}

/**
 * Default configuration for Indian electricity meters
 */
const DEFAULT_CONFIG: DataGeneratorConfig = {
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
export class DataGenerator {
    private config: DataGeneratorConfig;
    private lastValues: Map<string, number>;
    private timeOfDay: number;

    constructor(config: Partial<DataGeneratorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.lastValues = new Map();
        this.timeOfDay = 0;
    }

    /**
     * Generate a random value within variation limits
     */
    private generateValue(nominal: number, variation: number): number {
        const min = nominal * (1 - variation);
        const max = nominal * (1 + variation);
        return min + Math.random() * (max - min);
    }

    /**
     * Apply time-based load pattern
     */
    private getLoadFactor(): number {
        // Simulate typical daily load curve
        // Peak hours: 6-9 AM and 6-10 PM
        const hour = this.timeOfDay % 24;
        if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 22)) {
            return 1.2; // 20% higher during peak hours
        } else if (hour >= 23 || hour <= 5) {
            return 0.7; // 30% lower during night
        }
        return 1.0;
    }

    /**
     * Update time of day
     */
    public updateTime(hour: number): void {
        this.timeOfDay = hour;
    }

    /**
     * Generate voltage reading
     */
    public getVoltage(phase: number = 1): ScalarUnit {
        const key = `voltage_${phase}`;
        let value = this.lastValues.get(key) || this.config.voltage.nominal;
        
        // Small random variation
        value = this.generateValue(value, this.config.voltage.variation * 0.1);
        
        // Ensure within overall limits
        value = Math.max(
            this.config.voltage.nominal * (1 - this.config.voltage.variation),
            Math.min(this.config.voltage.nominal * (1 + this.config.voltage.variation), value)
        );
        
        this.lastValues.set(key, value);
        return { scalar: value, unit: Unit.VOLT };
    }

    /**
     * Generate current reading
     */
    public getCurrent(phase: number = 1): ScalarUnit {
        const loadFactor = this.getLoadFactor();
        const key = `current_${phase}`;
        let value = this.lastValues.get(key) || this.config.current.nominal;
        
        // Apply load pattern and random variation
        value = this.generateValue(value * loadFactor, this.config.current.variation * 0.1);
        
        // Ensure within overall limits
        value = Math.max(
            this.config.current.nominal * 0.1, // Minimum 10% of nominal
            Math.min(this.config.current.nominal * 1.5, value) // Maximum 150% of nominal
        );
        
        this.lastValues.set(key, value);
        return { scalar: value, unit: Unit.AMPERE };
    }

    /**
     * Generate frequency reading
     */
    public getFrequency(): ScalarUnit {
        const key = 'frequency';
        let value = this.lastValues.get(key) || this.config.frequency.nominal;
        
        // Small random variation
        value = this.generateValue(value, this.config.frequency.variation * 0.1);
        
        // Ensure within overall limits
        value = Math.max(
            this.config.frequency.nominal * (1 - this.config.frequency.variation),
            Math.min(this.config.frequency.nominal * (1 + this.config.frequency.variation), value)
        );
        
        this.lastValues.set(key, value);
        return { scalar: value, unit: Unit.HERTZ };
    }

    /**
     * Generate power factor reading
     */
    public getPowerFactor(phase: number = 1): ScalarUnit {
        const key = `pf_${phase}`;
        let value = this.lastValues.get(key) || this.config.powerFactor.nominal;
        
        // Small random variation
        value = this.generateValue(value, this.config.powerFactor.variation * 0.1);
        
        // Ensure within overall limits and between 0 and 1
        value = Math.max(
            0.7, // Minimum power factor
            Math.min(1.0, value)
        );
        
        this.lastValues.set(key, value);
        return { scalar: value, unit: Unit.NONE };
    }

    /**
     * Calculate active power
     */
    public getActivePower(phase: number = 1): ScalarUnit {
        const voltage = this.getVoltage(phase).scalar;
        const current = this.getCurrent(phase).scalar;
        const powerFactor = this.getPowerFactor(phase).scalar;
        
        const power = voltage * current * powerFactor;
        return { scalar: power, unit: Unit.WATT };
    }

    /**
     * Calculate reactive power
     */
    public getReactivePower(phase: number = 1): ScalarUnit {
        const voltage = this.getVoltage(phase).scalar;
        const current = this.getCurrent(phase).scalar;
        const powerFactor = this.getPowerFactor(phase).scalar;
        
        const power = voltage * current * Math.sin(Math.acos(powerFactor));
        return { scalar: power, unit: Unit.VAR };
    }

    /**
     * Calculate apparent power
     */
    public getApparentPower(phase: number = 1): ScalarUnit {
        const voltage = this.getVoltage(phase).scalar;
        const current = this.getCurrent(phase).scalar;
        
        const power = voltage * current;
        return { scalar: power, unit: Unit.VOLT_AMPERE };
    }
} 