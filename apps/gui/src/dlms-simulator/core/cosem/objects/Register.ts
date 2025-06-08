import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel, ScalarUnit, Unit } from '../data/Types';

/**
 * Register Class (IC: 3)
 * Holds a numeric value with scaling and units
 */
export class Register extends CosemInterfaceClass {
    private value: number;
    private scaler: number;
    private unit: Unit;
    private status: number;

    constructor(logicalName: ObisCode, unit: Unit = Unit.NONE, scaler: number = 0) {
        super(logicalName, 3);
        this.value = 0;
        this.scaler = scaler;
        this.unit = unit;
        this.status = 0;
        this.initializeAttributes();
    }

    private initializeAttributes(): void {
        // Attribute 2: value
        this.addAttribute(2, {
            name: 'value',
            type: 'double-long-unsigned',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.value
        });

        // Attribute 3: scaler_unit
        this.addAttribute(3, {
            name: 'scaler_unit',
            type: 'structure',
            access: AccessLevel.READ_ONLY,
            getValue: () => ({
                scaler: this.scaler,
                unit: this.unit
            })
        });

        // Attribute 4: status (optional)
        this.addAttribute(4, {
            name: 'status',
            type: 'unsigned',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.status
        });
    }

    /**
     * Get the current value
     */
    public getValue(): number {
        return this.value;
    }

    /**
     * Get the scaled value
     */
    public getScaledValue(): number {
        return this.value * Math.pow(10, this.scaler);
    }

    /**
     * Set a new value
     */
    public setValue(newValue: number): void {
        this.value = newValue;
    }

    /**
     * Get the scaler unit combination
     */
    public getScalarUnit(): ScalarUnit {
        return {
            scalar: this.scaler,
            unit: this.unit
        };
    }

    /**
     * Set the scaler
     */
    public setScaler(scaler: number): void {
        this.scaler = scaler;
    }

    /**
     * Set the unit
     */
    public setUnit(unit: Unit): void {
        this.unit = unit;
    }

    /**
     * Get the status
     */
    public getStatus(): number {
        return this.status;
    }

    /**
     * Set the status
     */
    public setStatus(status: number): void {
        this.status = status;
    }

    /**
     * Reset the register
     */
    public reset(): void {
        this.value = 0;
        this.status = 0;
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `${this.getScaledValue()} ${Unit[this.unit]}`;
    }
} 