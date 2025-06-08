import { Register } from './Register';
import { ObisCode } from '../ObisCode';
import { DataType } from '../types/DataType';

/**
 * Extended Register Class (IC: 4)
 * This class extends the Register class with capture time and status information
 */
export class ExtendedRegister extends Register {
    private captureTime: Date;
    private statusValid: boolean;

    constructor(
        logicalName: ObisCode,
        initialValue: number = 0,
        scaler: number = 0,
        unit: number = 0,
        status: number = 0,
        captureTime: Date = new Date()
    ) {
        super(logicalName, initialValue, scaler, unit, status);
        this.captureTime = captureTime;
        this.statusValid = true;

        // Register additional class attributes
        this.registerAttribute(5, 'capture_time', DataType.DATE_TIME, true);
        this.registerAttribute(6, 'status_valid', DataType.BOOLEAN, false);

        // Register additional class methods
        this.registerMethod(2, 'capture');
    }

    /**
     * Get capture time
     */
    public getCaptureTime(): Date {
        return new Date(this.captureTime);
    }

    /**
     * Set capture time
     */
    public setCaptureTime(time: Date): void {
        this.captureTime = new Date(time);
    }

    /**
     * Get status valid
     */
    public isStatusValid(): boolean {
        return this.statusValid;
    }

    /**
     * Capture current value
     */
    public capture(): void {
        this.captureTime = new Date();
        this.statusValid = true;
    }

    /**
     * Handle get request
     */
    protected handleGet(attributeId: number): any {
        switch (attributeId) {
            case 5:
                return this.getCaptureTime();
            case 6:
                return this.isStatusValid();
            default:
                return super.handleGet(attributeId);
        }
    }

    /**
     * Handle set request
     */
    protected handleSet(attributeId: number, value: any): void {
        switch (attributeId) {
            case 5:
                if (!(value instanceof Date)) {
                    throw new Error('Capture time must be a Date object');
                }
                this.setCaptureTime(value);
                break;
            case 6:
                throw new Error('Status valid is read-only');
            default:
                super.handleSet(attributeId, value);
        }
    }

    /**
     * Handle action request
     */
    protected handleAction(methodId: number, params?: any): void {
        switch (methodId) {
            case 2: // capture
                this.capture();
                break;
            default:
                super.handleAction(methodId, params);
        }
    }
} 