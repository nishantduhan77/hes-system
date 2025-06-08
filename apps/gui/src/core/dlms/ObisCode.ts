/**
 * OBIS Code Implementation
 * Represents a 6-byte OBIS code identifier
 */
export class ObisCode {
    private readonly values: number[];

    constructor(a: number, b: number, c: number, d: number, e: number, f: number) {
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
    public static fromString(obis: string): ObisCode {
        const values = obis.split('.').map(v => parseInt(v, 10));
        if (values.length !== 6) {
            throw new Error('OBIS code must have 6 values');
        }
        return new ObisCode(
            values[0],
            values[1],
            values[2],
            values[3],
            values[4],
            values[5]
        );
    }

    /**
     * Create from buffer
     */
    public static fromBuffer(buffer: Buffer): ObisCode {
        if (buffer.length !== 6) {
            throw new Error('OBIS code buffer must be 6 bytes');
        }
        return new ObisCode(
            buffer[0],
            buffer[1],
            buffer[2],
            buffer[3],
            buffer[4],
            buffer[5]
        );
    }

    /**
     * Create from array
     */
    public static fromArray(values: number[]): ObisCode {
        if (values.length !== 6) {
            throw new Error('OBIS code array must have 6 values');
        }
        return new ObisCode(
            values[0],
            values[1],
            values[2],
            values[3],
            values[4],
            values[5]
        );
    }

    /**
     * Get A value
     */
    public getA(): number {
        return this.values[0];
    }

    /**
     * Get B value
     */
    public getB(): number {
        return this.values[1];
    }

    /**
     * Get C value
     */
    public getC(): number {
        return this.values[2];
    }

    /**
     * Get D value
     */
    public getD(): number {
        return this.values[3];
    }

    /**
     * Get E value
     */
    public getE(): number {
        return this.values[4];
    }

    /**
     * Get F value
     */
    public getF(): number {
        return this.values[5];
    }

    /**
     * Convert to string
     */
    public toString(): string {
        return this.values.join('.');
    }

    /**
     * Convert to buffer
     */
    public toBuffer(): Buffer {
        return Buffer.from(this.values);
    }

    /**
     * Convert to array
     */
    public toArray(): number[] {
        return [...this.values];
    }

    /**
     * Check if equal to another OBIS code
     */
    public equals(other: ObisCode): boolean {
        return this.values.every((value, index) => value === other.values[index]);
    }

    /**
     * Check if matches pattern (including wildcards)
     */
    public matches(pattern: ObisCode): boolean {
        return this.values.every((value, index) => 
            pattern.isWildcard(index) || value === pattern.values[index]
        );
    }

    /**
     * Check if value at index is wildcard (255)
     */
    public isWildcard(index: number): boolean {
        return this.values[index] === 255;
    }

    /**
     * Validate single value
     */
    private validateValue(value: number): void {
        if (!Number.isInteger(value) || value < 0 || value > 255) {
            throw new Error('OBIS code values must be integers between 0 and 255');
        }
    }
} 