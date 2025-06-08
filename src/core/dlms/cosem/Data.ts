import { CosemInterfaceClass } from '../CosemInterfaceClass';
import { ObisCode } from '../ObisCode';
import { DataType } from '../types/DataType';

/**
 * Data Class (IC: 1)
 * This class is used for storing and retrieving simple data values
 */
export class Data extends CosemInterfaceClass {
    private value: any;
    private dataType: DataType;

    constructor(logicalName: ObisCode, dataType: DataType, initialValue?: any) {
        super(1, logicalName);
        this.dataType = dataType;
        this.value = initialValue;

        // Register class attributes
        this.registerAttribute(1, 'logical_name', DataType.OCTET_STRING, true);
        this.registerAttribute(2, 'value', this.dataType, true);
    }

    /**
     * Get value
     */
    public getValue(): any {
        return this.value;
    }

    /**
     * Set value
     */
    public setValue(value: any): void {
        // Validate value type
        if (!this.validateDataType(value)) {
            throw new Error(`Invalid value type for Data class. Expected ${DataType[this.dataType]}`);
        }
        this.value = value;
    }

    /**
     * Get data type
     */
    public getDataType(): DataType {
        return this.dataType;
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
            default:
                throw new Error(`Invalid attribute id ${attributeId} for Data class`);
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
                this.setValue(value);
                break;
            default:
                throw new Error(`Invalid attribute id ${attributeId} for Data class`);
        }
    }

    /**
     * Validate value against data type
     */
    private validateDataType(value: any): boolean {
        switch (this.dataType) {
            case DataType.ARRAY:
                return Array.isArray(value);
            case DataType.BCD:
                return typeof value === 'number' && value >= 0 && value <= 99;
            case DataType.BITSTRING:
                return typeof value === 'string' && /^[01]+$/.test(value);
            case DataType.BOOLEAN:
                return typeof value === 'boolean';
            case DataType.DATE:
            case DataType.DATE_TIME:
            case DataType.TIME:
                return value instanceof Date;
            case DataType.ENUM:
                return typeof value === 'number' && Number.isInteger(value);
            case DataType.FLOAT32:
            case DataType.FLOAT64:
                return typeof value === 'number';
            case DataType.INT16:
                return typeof value === 'number' && Number.isInteger(value) && value >= -32768 && value <= 32767;
            case DataType.INT32:
                return typeof value === 'number' && Number.isInteger(value) && value >= -2147483648 && value <= 2147483647;
            case DataType.INT64:
                return typeof value === 'bigint';
            case DataType.INT8:
                return typeof value === 'number' && Number.isInteger(value) && value >= -128 && value <= 127;
            case DataType.NULL_DATA:
                return value === null;
            case DataType.OCTET_STRING:
                return Buffer.isBuffer(value);
            case DataType.STRING:
            case DataType.STRING_UTF8:
                return typeof value === 'string';
            case DataType.STRUCT:
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case DataType.UINT16:
                return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 65535;
            case DataType.UINT32:
                return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4294967295;
            case DataType.UINT64:
                return typeof value === 'bigint' && value >= BigInt(0);
            case DataType.UINT8:
                return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255;
            default:
                return false;
        }
    }
} 