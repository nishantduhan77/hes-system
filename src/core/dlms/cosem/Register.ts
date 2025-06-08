import { CosemInterfaceClass } from '../CosemInterfaceClass';
import { ObisCode } from '../ObisCode';
import { DataType } from '../types/DataType';

/**
 * Scaler Unit
 */
interface ScalerUnit {
    scaler: number;
    unit: number;
}

/**
 * Register Class (IC: 3)
 * This class is used for storing and retrieving measurement values
 */
export class Register extends CosemInterfaceClass {
    private value: number;
    private scaler: number;
    private unit: number;
    private status: number;

    constructor(
        logicalName: ObisCode,
        initialValue: number = 0,
        scaler: number = 0,
        unit: number = 0,
        status: number = 0
    ) {
        super(3, logicalName);
        this.value = initialValue;
        this.scaler = scaler;
        this.unit = unit;
        this.status = status;

        // Register class attributes
        this.registerAttribute(1, 'logical_name', DataType.OCTET_STRING, false);
        this.registerAttribute(2, 'value', DataType.FLOAT64, true);
        this.registerAttribute(3, 'scaler_unit', DataType.STRUCT, false);
        this.registerAttribute(4, 'status', DataType.UINT8, true);

        // Register class methods
        this.registerMethod(1, 'reset');
    }

    /**
     * Get value
     */
    public getValue(): number {
        return this.value;
    }

    /**
     * Set value
     */
    public setValue(value: number): void {
        this.value = value;
    }

    /**
     * Get scaler
     */
    public getScaler(): number {
        return this.scaler;
    }

    /**
     * Get unit
     */
    public getUnit(): number {
        return this.unit;
    }

    /**
     * Get status
     */
    public getStatus(): number {
        return this.status;
    }

    /**
     * Set status
     */
    public setStatus(status: number): void {
        if (status < 0 || status > 255) {
            throw new Error('Status must be between 0 and 255');
        }
        this.status = status;
    }

    /**
     * Get scaled value
     */
    public getScaledValue(): number {
        return this.value * Math.pow(10, this.scaler);
    }

    /**
     * Handle get request
     */
    protected handleGet(attributeId: number): any {
        switch (attributeId) {
            case 1:
                return this.getLogicalName().toBuffer();
            case 2:
                return this.getValue();
            case 3:
                return {
                    scaler: this.getScaler(),
                    unit: this.getUnit()
                } as ScalerUnit;
            case 4:
                return this.getStatus();
            default:
                throw new Error(`Invalid attribute id ${attributeId} for Register class`);
        }
    }

    /**
     * Handle set request
     */
    protected handleSet(attributeId: number, value: any): void {
        switch (attributeId) {
            case 1:
                throw new Error('Logical name is read-only');
            case 2:
                if (typeof value !== 'number') {
                    throw new Error('Value must be a number');
                }
                this.setValue(value);
                break;
            case 3:
                throw new Error('Scaler unit is read-only');
            case 4:
                if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 255) {
                    throw new Error('Status must be an integer between 0 and 255');
                }
                this.setStatus(value);
                break;
            default:
                throw new Error(`Invalid attribute id ${attributeId} for Register class`);
        }
    }

    /**
     * Handle action request
     */
    protected handleAction(methodId: number, params?: any): void {
        switch (methodId) {
            case 1: // reset
                this.value = 0;
                this.status = 0;
                break;
            default:
                throw new Error(`Invalid method id ${methodId} for Register class`);
        }
    }
} 