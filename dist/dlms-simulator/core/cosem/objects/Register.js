"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Register = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const Types_1 = require("../data/Types");
/**
 * Register Class (IC: 3)
 * Holds a numeric value with scaling and units
 */
class Register extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, unit = Types_1.Unit.NONE, scaler = 0) {
        super(logicalName, 3);
        this.value = 0;
        this.scaler = scaler;
        this.unit = unit;
        this.status = 0;
        this.initializeAttributes();
    }
    initializeAttributes() {
        // Attribute 2: value
        this.addAttribute(2, {
            name: 'value',
            type: 'double-long-unsigned',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.value
        });
        // Attribute 3: scaler_unit
        this.addAttribute(3, {
            name: 'scaler_unit',
            type: 'structure',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => ({
                scaler: this.scaler,
                unit: this.unit
            })
        });
        // Attribute 4: status (optional)
        this.addAttribute(4, {
            name: 'status',
            type: 'unsigned',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.status
        });
    }
    /**
     * Get the current value
     */
    getValue() {
        return this.value;
    }
    /**
     * Get the scaled value
     */
    getScaledValue() {
        return this.value * Math.pow(10, this.scaler);
    }
    /**
     * Set a new value
     */
    setValue(newValue) {
        this.value = newValue;
    }
    /**
     * Get the scaler unit combination
     */
    getScalarUnit() {
        return {
            scalar: this.scaler,
            unit: this.unit
        };
    }
    /**
     * Set the scaler
     */
    setScaler(scaler) {
        this.scaler = scaler;
    }
    /**
     * Set the unit
     */
    setUnit(unit) {
        this.unit = unit;
    }
    /**
     * Get the status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Set the status
     */
    setStatus(status) {
        this.status = status;
    }
    /**
     * Reset the register
     */
    reset() {
        this.value = 0;
        this.status = 0;
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `${this.getScaledValue()} ${Types_1.Unit[this.unit]}`;
    }
}
exports.Register = Register;
