"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObisCode = void 0;
/**
 * OBIS Code class for handling 6-byte OBIS code identifiers
 * Format: A-B:C.D.E.F
 * A: Media (0=abstract, 1=electricity, 6=heat, 7=gas, etc.)
 * B: Channel (0=no channel, 1-64=channel number)
 * C: Physical value (current, voltage, energy, etc.)
 * D: Measurement type (total, rate 1, rate 2, etc.)
 * E: Tariff (0=total, 1-63=tariff rate)
 * F: Billing period (0=current, 1-63=historical values)
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
    /**
     * Create ObisCode from string representation
     */
    static fromString(code) {
        // Remove any whitespace
        code = code.replace(/\s/g, '');
        // Match the OBIS code pattern
        const pattern = /^(\d+)-(\d+):(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
        const match = code.match(pattern);
        if (!match) {
            throw new Error('Invalid OBIS code format. Expected format: A-B:C.D.E.F');
        }
        const [, a, b, c, d, e, f] = match.map(Number);
        return new ObisCode(a, b, c, d, e, f);
    }
    /**
     * Create ObisCode from buffer
     */
    static fromBuffer(buffer) {
        if (buffer.length !== 6) {
            throw new Error('OBIS code buffer must be 6 bytes');
        }
        return new ObisCode(buffer[0], buffer[1], buffer[2], buffer[3], buffer[4], buffer[5]);
    }
    /**
     * Get value A (Media)
     */
    getA() {
        return this.a;
    }
    /**
     * Get value B (Channel)
     */
    getB() {
        return this.b;
    }
    /**
     * Get value C (Physical value)
     */
    getC() {
        return this.c;
    }
    /**
     * Get value D (Measurement type)
     */
    getD() {
        return this.d;
    }
    /**
     * Get value E (Tariff)
     */
    getE() {
        return this.e;
    }
    /**
     * Get value F (Billing period)
     */
    getF() {
        return this.f;
    }
    /**
     * Convert to buffer
     */
    toBuffer() {
        const buffer = Buffer.alloc(6);
        buffer[0] = this.a;
        buffer[1] = this.b;
        buffer[2] = this.c;
        buffer[3] = this.d;
        buffer[4] = this.e;
        buffer[5] = this.f;
        return buffer;
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `${this.a}-${this.b}:${this.c}.${this.d}.${this.e}.${this.f}`;
    }
    /**
     * Compare with another OBIS code
     */
    equals(other) {
        return (this.a === other.a &&
            this.b === other.b &&
            this.c === other.c &&
            this.d === other.d &&
            this.e === other.e &&
            this.f === other.f);
    }
    /**
     * Validate OBIS code value
     */
    validateValue(value, min, max, field) {
        if (!Number.isInteger(value) || value < min || value > max) {
            throw new Error(`Invalid OBIS code ${field} value: ${value}. Must be an integer between ${min} and ${max}`);
        }
    }
}
exports.ObisCode = ObisCode;
