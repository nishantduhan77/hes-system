"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObisCode = void 0;
/**
 * OBIS Code Implementation
 * Represents a 6-byte OBIS code identifier
 */
class ObisCode {
    constructor(a, b, c, d, e, f) {
        this.validateValue(a);
        this.validateValue(b);
        this.validateValue(c);
        this.validateValue(d);
        this.validateValue(e);
        this.validateValue(f);
        this.values = [a, b, c, d, e, f];
    }
    /**
     * Create from string
     */
    static fromString(obis) {
        const values = obis.split('.').map(v => parseInt(v, 10));
        if (values.length !== 6) {
            throw new Error('OBIS code must have 6 values');
        }
        return new ObisCode(values[0], values[1], values[2], values[3], values[4], values[5]);
    }
    /**
     * Create from buffer
     */
    static fromBuffer(buffer) {
        if (buffer.length !== 6) {
            throw new Error('OBIS code buffer must be 6 bytes');
        }
        return new ObisCode(buffer[0], buffer[1], buffer[2], buffer[3], buffer[4], buffer[5]);
    }
    /**
     * Create from array
     */
    static fromArray(values) {
        if (values.length !== 6) {
            throw new Error('OBIS code array must have 6 values');
        }
        return new ObisCode(values[0], values[1], values[2], values[3], values[4], values[5]);
    }
    /**
     * Get A value
     */
    getA() {
        return this.values[0];
    }
    /**
     * Get B value
     */
    getB() {
        return this.values[1];
    }
    /**
     * Get C value
     */
    getC() {
        return this.values[2];
    }
    /**
     * Get D value
     */
    getD() {
        return this.values[3];
    }
    /**
     * Get E value
     */
    getE() {
        return this.values[4];
    }
    /**
     * Get F value
     */
    getF() {
        return this.values[5];
    }
    /**
     * Convert to string
     */
    toString() {
        return this.values.join('.');
    }
    /**
     * Convert to buffer
     */
    toBuffer() {
        return Buffer.from(this.values);
    }
    /**
     * Convert to array
     */
    toArray() {
        return [...this.values];
    }
    /**
     * Check if equal to another OBIS code
     */
    equals(other) {
        return this.values.every((value, index) => value === other.values[index]);
    }
    /**
     * Check if matches pattern (including wildcards)
     */
    matches(pattern) {
        return this.values.every((value, index) => pattern.isWildcard(index) || value === pattern.values[index]);
    }
    /**
     * Check if value at index is wildcard (255)
     */
    isWildcard(index) {
        return this.values[index] === 255;
    }
    /**
     * Validate single value
     */
    validateValue(value) {
        if (!Number.isInteger(value) || value < 0 || value > 255) {
            throw new Error('OBIS code values must be integers between 0 and 255');
        }
    }
}
exports.ObisCode = ObisCode;
