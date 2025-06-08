"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Data = void 0;
const CosemInterfaceClass_1 = require("../CosemInterfaceClass");
const DataType_1 = require("../types/DataType");
/**
 * Data Class (IC: 1)
 * This class is used for storing and retrieving simple data values
 */
class Data extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, dataType, initialValue) {
        super(1, logicalName);
        this.dataType = dataType;
        this.value = initialValue;
        // Register class attributes
        this.registerAttribute(1, 'logical_name', DataType_1.DataType.OCTET_STRING, true);
        this.registerAttribute(2, 'value', this.dataType, true);
    }
    /**
     * Get value
     */
    getValue() {
        return this.value;
    }
    /**
     * Set value
     */
    setValue(value) {
        // Validate value type
        if (!this.validateDataType(value)) {
            throw new Error(`Invalid value type for Data class. Expected ${DataType_1.DataType[this.dataType]}`);
        }
        this.value = value;
    }
    /**
     * Get data type
     */
    getDataType() {
        return this.dataType;
    }
    /**
     * Handle get request
     */
    handleGet(attributeId) {
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
    handleSet(attributeId, value) {
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
    validateDataType(value) {
        switch (this.dataType) {
            case DataType_1.DataType.ARRAY:
                return Array.isArray(value);
            case DataType_1.DataType.BCD:
                return typeof value === 'number' && value >= 0 && value <= 99;
            case DataType_1.DataType.BITSTRING:
                return typeof value === 'string' && /^[01]+$/.test(value);
            case DataType_1.DataType.BOOLEAN:
                return typeof value === 'boolean';
            case DataType_1.DataType.DATE:
            case DataType_1.DataType.DATE_TIME:
            case DataType_1.DataType.TIME:
                return value instanceof Date;
            case DataType_1.DataType.ENUM:
                return typeof value === 'number' && Number.isInteger(value);
            case DataType_1.DataType.FLOAT32:
            case DataType_1.DataType.FLOAT64:
                return typeof value === 'number';
            case DataType_1.DataType.INT16:
                return typeof value === 'number' && Number.isInteger(value) && value >= -32768 && value <= 32767;
            case DataType_1.DataType.INT32:
                return typeof value === 'number' && Number.isInteger(value) && value >= -2147483648 && value <= 2147483647;
            case DataType_1.DataType.INT64:
                return typeof value === 'bigint';
            case DataType_1.DataType.INT8:
                return typeof value === 'number' && Number.isInteger(value) && value >= -128 && value <= 127;
            case DataType_1.DataType.NULL_DATA:
                return value === null;
            case DataType_1.DataType.OCTET_STRING:
                return Buffer.isBuffer(value);
            case DataType_1.DataType.STRING:
            case DataType_1.DataType.STRING_UTF8:
                return typeof value === 'string';
            case DataType_1.DataType.STRUCT:
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case DataType_1.DataType.UINT16:
                return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 65535;
            case DataType_1.DataType.UINT32:
                return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4294967295;
            case DataType_1.DataType.UINT64:
                return typeof value === 'bigint' && value >= BigInt(0);
            case DataType_1.DataType.UINT8:
                return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255;
            default:
                return false;
        }
    }
}
exports.Data = Data;
