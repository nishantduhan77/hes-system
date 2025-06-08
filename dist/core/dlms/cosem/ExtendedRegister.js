"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedRegister = void 0;
const Register_1 = require("./Register");
const DataType_1 = require("../types/DataType");
/**
 * Extended Register Class (IC: 4)
 * This class extends the Register class with capture time and status information
 */
class ExtendedRegister extends Register_1.Register {
    constructor(logicalName, initialValue = 0, scaler = 0, unit = 0, status = 0, captureTime = new Date()) {
        super(logicalName, initialValue, scaler, unit, status);
        this.captureTime = captureTime;
        this.statusValid = true;
        // Register additional class attributes
        this.registerAttribute(5, 'capture_time', DataType_1.DataType.DATE_TIME, true);
        this.registerAttribute(6, 'status_valid', DataType_1.DataType.BOOLEAN, false);
        // Register additional class methods
        this.registerMethod(2, 'capture');
    }
    /**
     * Get capture time
     */
    getCaptureTime() {
        return new Date(this.captureTime);
    }
    /**
     * Set capture time
     */
    setCaptureTime(time) {
        this.captureTime = new Date(time);
    }
    /**
     * Get status valid
     */
    isStatusValid() {
        return this.statusValid;
    }
    /**
     * Capture current value
     */
    capture() {
        this.captureTime = new Date();
        this.statusValid = true;
    }
    /**
     * Handle get request
     */
    handleGet(attributeId) {
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
    handleSet(attributeId, value) {
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
    handleAction(methodId, params) {
        switch (methodId) {
            case 2: // capture
                this.capture();
                break;
            default:
                super.handleAction(methodId, params);
        }
    }
}
exports.ExtendedRegister = ExtendedRegister;
