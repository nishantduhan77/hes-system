import { Register } from './Register';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel, Unit } from '../data/Types';

/**
 * Extended Register Class (IC: 4)
 * Extends Register with capture time and status
 */
export class ExtendedRegister extends Register {
    private captureTime: Date;
    private resetThreshold: number | null;
    private lastResetTime: Date | null;

    constructor(logicalName: ObisCode, unit: Unit = Unit.NONE, scaler: number = 0) {
        super(logicalName, unit, scaler);
        this.captureTime = new Date();
        this.resetThreshold = null;
        this.lastResetTime = null;
        this.initializeExtendedAttributes();
    }

    private initializeExtendedAttributes(): void {
        // Attribute 5: capture_time
        this.addAttribute(5, {
            name: 'capture_time',
            type: 'date-time',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.captureTime
        });

        // Attribute 6: reset_threshold
        this.addAttribute(6, {
            name: 'reset_threshold',
            type: 'double-long-unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.resetThreshold,
            setValue: (value: number) => {
                this.resetThreshold = value;
            }
        });

        // Attribute 7: last_reset_time
        this.addAttribute(7, {
            name: 'last_reset_time',
            type: 'date-time',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.lastResetTime
        });

        // Add reset method
        this.addMethod(1, {
            name: 'reset',
            execute: () => this.reset()
        });
    }

    /**
     * Override setValue to include capture time update
     */
    public setValue(newValue: number): void {
        super.setValue(newValue);
        this.captureTime = new Date();
        
        // Check reset threshold
        if (this.resetThreshold !== null && newValue >= this.resetThreshold) {
            this.reset();
        }
    }

    /**
     * Get capture time
     */
    public getCaptureTime(): Date {
        return this.captureTime;
    }

    /**
     * Get reset threshold
     */
    public getResetThreshold(): number | null {
        return this.resetThreshold;
    }

    /**
     * Set reset threshold
     */
    public setResetThreshold(threshold: number | null): void {
        this.resetThreshold = threshold;
    }

    /**
     * Get last reset time
     */
    public getLastResetTime(): Date | null {
        return this.lastResetTime;
    }

    /**
     * Override reset to include last reset time
     */
    public reset(): void {
        super.reset();
        this.lastResetTime = new Date();
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `${super.toString()} @ ${this.captureTime.toISOString()}`;
    }
} 