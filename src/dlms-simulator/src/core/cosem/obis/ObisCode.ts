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
export class ObisCode {
    private a: number;
    private b: number;
    private c: number;
    private d: number;
    private e: number;
    private f: number;

    constructor(a: number, b: number, c: number, d: number, e: number, f: number) {
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
    public static fromString(code: string): ObisCode {
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
     * Get value A (Media)
     */
    public getA(): number {
        return this.a;
    }

    /**
     * Get value B (Channel)
     */
    public getB(): number {
        return this.b;
    }

    /**
     * Get value C (Physical value)
     */
    public getC(): number {
        return this.c;
    }

    /**
     * Get value D (Measurement type)
     */
    public getD(): number {
        return this.d;
    }

    /**
     * Get value E (Tariff)
     */
    public getE(): number {
        return this.e;
    }

    /**
     * Get value F (Billing period)
     */
    public getF(): number {
        return this.f;
    }

    /**
     * Convert to buffer
     */
    public toBuffer(): Buffer {
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
    public toString(): string {
        return `${this.a}-${this.b}:${this.c}.${this.d}.${this.e}.${this.f}`;
    }

    /**
     * Compare with another OBIS code
     */
    public equals(other: ObisCode): boolean {
        return (
            this.a === other.a &&
            this.b === other.b &&
            this.c === other.c &&
            this.d === other.d &&
            this.e === other.e &&
            this.f === other.f
        );
    }

    /**
     * Validate OBIS code value
     */
    private validateValue(value: number, min: number, max: number, field: string): void {
        if (!Number.isInteger(value) || value < min || value > max) {
            throw new Error(
                `Invalid OBIS code ${field} value: ${value}. Must be an integer between ${min} and ${max}`
            );
        }
    }
} 