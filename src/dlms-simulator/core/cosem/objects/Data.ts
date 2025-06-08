import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel, DlmsDataType } from '../data/Types';

/**
 * Data Class (IC: 1)
 * Holds a single value of any simple DLMS data type
 */
export class Data extends CosemInterfaceClass {
    private value: any;
    private dataType: DlmsDataType;

    constructor(logicalName: ObisCode, dataType: DlmsDataType = 'octet-string') {
        super(logicalName, 1);
        this.dataType = dataType;
        this.value = null;
        this.initializeAttributes();
    }

    private initializeAttributes(): void {
        // Attribute 2: value
        this.addAttribute(2, {
            name: 'value',
            type: this.dataType,
            access: AccessLevel.READ_WRITE,
            getValue: () => this.value,
            setValue: (newValue: any) => {
                this.value = newValue;
            }
        });
    }

    /**
     * Get the current value
     */
    public getValue(): any {
        return this.value;
    }

    /**
     * Set a new value
     */
    public setValue(newValue: any): void {
        this.value = newValue;
    }

    /**
     * Get the data type
     */
    public getDataType(): DlmsDataType {
        return this.dataType;
    }

    /**
     * Reset the value to null
     */
    public reset(): void {
        this.value = null;
    }

    /**
     * Check if the value is null
     */
    public isNull(): boolean {
        return this.value === null;
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        if (this.isNull()) {
            return 'null';
        }
        return String(this.value);
    }
} 