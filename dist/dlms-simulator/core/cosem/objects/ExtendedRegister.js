"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedRegister = void 0;
const Register_1 = require("./Register");
const Types_1 = require("../data/Types");
/**
 * Extended Register Class (IC: 4)
 * Extends Register with capture time and status
 */
class ExtendedRegister extends Register_1.Register {
    constructor(logicalName, unit = Types_1.Unit.NONE, scaler = 0) {
        super(logicalName, unit, scaler);
        this.captureTime = new Date();
        this.resetThreshold = null;
        this.lastResetTime = null;
        this.initializeExtendedAttributes();
    }
    initializeExtendedAttributes() {
        // Attribute 5: capture_time
        this.addAttribute(5, {
            name: 'capture_time',
            type: 'date-time',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.captureTime
        });
        // Attribute 6: reset_threshold
        this.addAttribute(6, {
            name: 'reset_threshold',
            type: 'double-long-unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.resetThreshold,
            setValue: (value) => {
                this.resetThreshold = value;
            }
        });
        // Attribute 7: last_reset_time
        this.addAttribute(7, {
            name: 'last_reset_time',
            type: 'date-time',
            access: Types_1.AccessLevel.READ_ONLY,
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
    setValue(newValue) {
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
    getCaptureTime() {
        return this.captureTime;
    }
    /**
     * Get reset threshold
     */
    getResetThreshold() {
        return this.resetThreshold;
    }
    /**
     * Set reset threshold
     */
    setResetThreshold(threshold) {
        this.resetThreshold = threshold;
    }
    /**
     * Get last reset time
     */
    getLastResetTime() {
        return this.lastResetTime;
    }
    /**
     * Override reset to include last reset time
     */
    reset() {
        super.reset();
        this.lastResetTime = new Date();
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `${super.toString()} @ ${this.captureTime.toISOString()}`;
    }
}
exports.ExtendedRegister = ExtendedRegister;
