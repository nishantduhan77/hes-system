import { MeterReading } from '../types/meter';
import { ValidationConfig } from '../config/data-injection.config';

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class DataValidator {
    private config: ValidationConfig;

    constructor(config: ValidationConfig) {
        this.config = config;
    }

    public async validateMeterData(reading: MeterReading): Promise<MeterReading> {
        if (!this.config.validateDataQuality) {
            return reading;
        }

        const errors: string[] = [];

        // Validate voltage
        if (!this.isInRange(
            reading.readings.voltage,
            this.config.qualityThresholds.voltage.min,
            this.config.qualityThresholds.voltage.max
        )) {
            errors.push(`Voltage ${reading.readings.voltage}${this.config.qualityThresholds.voltage.unit} is out of range`);
        }

        // Validate current
        if (!this.isInRange(
            reading.readings.current,
            this.config.qualityThresholds.current.min,
            this.config.qualityThresholds.current.max
        )) {
            errors.push(`Current ${reading.readings.current}${this.config.qualityThresholds.current.unit} is out of range`);
        }

        // Validate power
        if (!this.isInRange(
            reading.readings.power,
            this.config.qualityThresholds.power.min,
            this.config.qualityThresholds.power.max
        )) {
            errors.push(`Power ${reading.readings.power}${this.config.qualityThresholds.power.unit} is out of range`);
        }

        // Validate frequency
        if (!this.isInRange(
            reading.readings.frequency,
            this.config.qualityThresholds.frequency.min,
            this.config.qualityThresholds.frequency.max
        )) {
            errors.push(`Frequency ${reading.readings.frequency}${this.config.qualityThresholds.frequency.unit} is out of range`);
        }

        // Update quality status based on validation results
        if (errors.length > 0) {
            reading.status.quality = errors.length > 2 ? 'BAD' : 'QUESTIONABLE';
            console.warn(`Validation warnings for meter ${reading.meterId}:`, errors);
        }

        return reading;
    }

    public async validateBatchReadings(readings: MeterReading[]): Promise<MeterReading[]> {
        return Promise.all(readings.map(reading => this.validateMeterData(reading)));
    }

    private isInRange(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    public updateConfig(config: Partial<ValidationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    public getValidationStats(readings: MeterReading[]): {
        totalReadings: number;
        goodQuality: number;
        questionableQuality: number;
        badQuality: number;
    } {
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