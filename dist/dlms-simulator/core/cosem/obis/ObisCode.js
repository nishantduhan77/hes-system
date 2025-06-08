"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObisCode = void 0;
/**
 * OBIS Code class
 * Represents a 6-byte OBIS code identifier used in DLMS/COSEM
 */
class ObisCode {
    constructor(a, b, c, d, e, f) {
        this.validateValue(a, 0, 255, 'A');
        this.validateValue(b, 0, 255, 'B');
        this.validateValue(c, 0, 255, 'C');
        this.validateValue(d, 0, 255, 'D');
        this.validateValue(e, 0, 255, 'E');
        this.validateValue(f, 0, 255, 'F');
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
    }
    validateValue(value, min, max, group) {
        if (!Number.isInteger(value) || value < min || value > max) {
            throw new Error(`Invalid OBIS code ${group}-value: ${value}. Must be an integer between ${min} and ${max}`);
        }
    }
    /**
     * Create an OBIS code from a string representation
     */
    static fromString(obisString) {
        const parts = obisString.split('.');
        if (parts.length !== 6) {
            throw new Error('Invalid OBIS code string format. Expected format: A.B.C.D.E.F');
        }
        const values = parts.map(part => parseInt(part, 10));
        return new ObisCode(values[0], values[1], values[2], values[3], values[4], values[5]);
    }
    /**
     * Create an OBIS code from a buffer
     */
    static fromBuffer(buffer) {
        if (buffer.length !== 6) {
            throw new Error('Invalid buffer length. OBIS code must be 6 bytes');
        }
        return new ObisCode(buffer[0], buffer[1], buffer[2], buffer[3], buffer[4], buffer[5]);
    }
    /**
     * Get the A-value (media)
     */
    getA() {
        return this.a;
    }
    /**
     * Get the B-value (channel)
     */
    getB() {
        return this.b;
    }
    /**
     * Get the C-value (physical value or measurement type)
     */
    getC() {
        return this.c;
    }
    /**
     * Get the D-value (measurement algorithm or tariff)
     */
    getD() {
        return this.d;
    }
    /**
     * Get the E-value (measurement period or billing period)
     */
    getE() {
        return this.e;
    }
    /**
     * Get the F-value (storage mechanism or tariff)
     */
    getF() {
        return this.f;
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `${this.a}.${this.b}.${this.c}.${this.d}.${this.e}.${this.f}`;
    }
    /**
     * Convert to buffer
     */
    toBuffer() {
        return Buffer.from([this.a, this.b, this.c, this.d, this.e, this.f]);
    }
    /**
     * Check if two OBIS codes are equal
     */
    equals(other) {
        return this.a === other.a &&
            this.b === other.b &&
            this.c === other.c &&
            this.d === other.d &&
            this.e === other.e &&
            this.f === other.f;
    }
    /**
     * Create a copy of this OBIS code
     */
    clone() {
        return new ObisCode(this.a, this.b, this.c, this.d, this.e, this.f);
    }
}
exports.ObisCode = ObisCode;
/**
 * Common OBIS codes
 */
ObisCode.CLOCK = new ObisCode(0, 0, 1, 0, 0, 255);
ObisCode.ACTIVE_POWER_PLUS = new ObisCode(1, 0, 1, 7, 0, 255);
ObisCode.ACTIVE_POWER_MINUS = new ObisCode(1, 0, 2, 7, 0, 255);
ObisCode.REACTIVE_POWER_PLUS = new ObisCode(1, 0, 3, 7, 0, 255);
ObisCode.REACTIVE_POWER_MINUS = new ObisCode(1, 0, 4, 7, 0, 255);
ObisCode.ACTIVE_ENERGY_PLUS = new ObisCode(1, 0, 1, 8, 0, 255);
ObisCode.ACTIVE_ENERGY_MINUS = new ObisCode(1, 0, 2, 8, 0, 255);
ObisCode.REACTIVE_ENERGY_PLUS = new ObisCode(1, 0, 3, 8, 0, 255);
ObisCode.REACTIVE_ENERGY_MINUS = new ObisCode(1, 0, 4, 8, 0, 255);
ObisCode.VOLTAGE_L1 = new ObisCode(1, 0, 32, 7, 0, 255);
ObisCode.VOLTAGE_L2 = new ObisCode(1, 0, 52, 7, 0, 255);
ObisCode.VOLTAGE_L3 = new ObisCode(1, 0, 72, 7, 0, 255);
ObisCode.CURRENT_L1 = new ObisCode(1, 0, 31, 7, 0, 255);
ObisCode.CURRENT_L2 = new ObisCode(1, 0, 51, 7, 0, 255);
ObisCode.CURRENT_L3 = new ObisCode(1, 0, 71, 7, 0, 255);
