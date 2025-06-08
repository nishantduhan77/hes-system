"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Register = void 0;
const CosemInterfaceClass_1 = require("../CosemInterfaceClass");
const DataType_1 = require("../types/DataType");
/**
 * Register Class (IC: 3)
 * This class is used for storing and retrieving measurement values
 */
class Register extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, initialValue = 0, scaler = 0, unit = 0, status = 0) {
        super(3, logicalName);
        this.value = initialValue;
        this.scaler = scaler;
        this.unit = unit;
        this.status = status;
        // Register class attributes
        this.registerAttribute(1, 'logical_name', DataType_1.DataType.OCTET_STRING, false);
        this.registerAttribute(2, 'value', DataType_1.DataType.FLOAT64, true);
        this.registerAttribute(3, 'scaler_unit', DataType_1.DataType.STRUCT, false);
        this.registerAttribute(4, 'status', DataType_1.DataType.UINT8, true);
        // Register class methods
        this.registerMethod(1, 'reset');
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
        this.value = value;
    }
    /**
     * Get scaler
     */
    getScaler() {
        return this.scaler;
    }
    /**
     * Get unit
     */
    getUnit() {
        return this.unit;
    }
    /**
     * Get status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Set status
     */
    setStatus(status) {
        if (status < 0 || status > 255) {
            throw new Error('Status must be between 0 and 255');
        }
        this.status = status;
    }
    /**
     * Get scaled value
     */
    getScaledValue() {
        return this.value * Math.pow(10, this.scaler);
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
            case 3:
                return {
                    scaler: this.getScaler(),
                    unit: this.getUnit()
                };
            case 4:
                return this.getStatus();
            default:
                throw new Error(`Invalid attribute id ${attributeId} for Register class`);
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
    handleAction(methodId, params) {
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
exports.Register = Register;
