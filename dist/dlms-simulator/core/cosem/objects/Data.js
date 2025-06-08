"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Data = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const Types_1 = require("../data/Types");
/**
 * Data Class (IC: 1)
 * Holds a single value of any simple DLMS data type
 */
class Data extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, dataType = 'octet-string') {
        super(logicalName, 1);
        this.dataType = dataType;
        this.value = null;
        this.initializeAttributes();
    }
    initializeAttributes() {
        // Attribute 2: value
        this.addAttribute(2, {
            name: 'value',
            type: this.dataType,
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.value,
            setValue: (newValue) => {
                this.value = newValue;
            }
        });
    }
    /**
     * Get the current value
     */
    getValue() {
        return this.value;
    }
    /**
     * Set a new value
     */
    setValue(newValue) {
        this.value = newValue;
    }
    /**
     * Get the data type
     */
    getDataType() {
        return this.dataType;
    }
    /**
     * Reset the value to null
     */
    reset() {
        this.value = null;
    }
    /**
     * Check if the value is null
     */
    isNull() {
        return this.value === null;
    }
    /**
     * Convert to string representation
     */
    toString() {
        if (this.isNull()) {
            return 'null';
        }
        return String(this.value);
    }
}
exports.Data = Data;
