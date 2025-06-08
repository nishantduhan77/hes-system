/**
 * OBIS Code class
 * Represents a 6-byte OBIS code identifier used in DLMS/COSEM
 */
export class ObisCode {
    private a: number; // Media (0 = abstract objects, 1 = electricity)
    private b: number; // Channel (0 = no channel)
    private c: number; // Physical value or measurement type
    private d: number; // Measurement algorithm or tariff
    private e: number; // Measurement period or billing period
    private f: number; // Storage mechanism or tariff

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

    private validateValue(value: number, min: number, max: number, group: string): void {
        if (!Number.isInteger(value) || value < min || value > max) {
            throw new Error(`Invalid OBIS code ${group}-value: ${value}. Must be an integer between ${min} and ${max}`);
        }
    }

    /**
     * Create an OBIS code from a string representation
     */
    public static fromString(obisString: string): ObisCode {
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
    public static fromBuffer(buffer: Buffer): ObisCode {
        if (buffer.length !== 6) {
            throw new Error('Invalid buffer length. OBIS code must be 6 bytes');
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
     * Get the A-value (media)
     */
    public getA(): number {
        return this.a;
    }

    /**
     * Get the B-value (channel)
     */
    public getB(): number {
        return this.b;
    }

    /**
     * Get the C-value (physical value or measurement type)
     */
    public getC(): number {
        return this.c;
    }

    /**
     * Get the D-value (measurement algorithm or tariff)
     */
    public getD(): number {
        return this.d;
    }

    /**
     * Get the E-value (measurement period or billing period)
     */
    public getE(): number {
        return this.e;
    }

    /**
     * Get the F-value (storage mechanism or tariff)
     */
    public getF(): number {
        return this.f;
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `${this.a}.${this.b}.${this.c}.${this.d}.${this.e}.${this.f}`;
    }

    /**
     * Convert to buffer
     */
    public toBuffer(): Buffer {
        return Buffer.from([this.a, this.b, this.c, this.d, this.e, this.f]);
    }

    /**
     * Check if two OBIS codes are equal
     */
    public equals(other: ObisCode): boolean {
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
    public clone(): ObisCode {
        return new ObisCode(this.a, this.b, this.c, this.d, this.e, this.f);
    }

    /**
     * Common OBIS codes
     */
    public static readonly CLOCK = new ObisCode(0, 0, 1, 0, 0, 255);
    public static readonly ACTIVE_POWER_PLUS = new ObisCode(1, 0, 1, 7, 0, 255);
    public static readonly ACTIVE_POWER_MINUS = new ObisCode(1, 0, 2, 7, 0, 255);
    public static readonly REACTIVE_POWER_PLUS = new ObisCode(1, 0, 3, 7, 0, 255);
    public static readonly REACTIVE_POWER_MINUS = new ObisCode(1, 0, 4, 7, 0, 255);
    public static readonly ACTIVE_ENERGY_PLUS = new ObisCode(1, 0, 1, 8, 0, 255);
    public static readonly ACTIVE_ENERGY_MINUS = new ObisCode(1, 0, 2, 8, 0, 255);
    public static readonly REACTIVE_ENERGY_PLUS = new ObisCode(1, 0, 3, 8, 0, 255);
    public static readonly REACTIVE_ENERGY_MINUS = new ObisCode(1, 0, 4, 8, 0, 255);
    public static readonly VOLTAGE_L1 = new ObisCode(1, 0, 32, 7, 0, 255);
    public static readonly VOLTAGE_L2 = new ObisCode(1, 0, 52, 7, 0, 255);
    public static readonly VOLTAGE_L3 = new ObisCode(1, 0, 72, 7, 0, 255);
    public static readonly CURRENT_L1 = new ObisCode(1, 0, 31, 7, 0, 255);
    public static readonly CURRENT_L2 = new ObisCode(1, 0, 51, 7, 0, 255);
    public static readonly CURRENT_L3 = new ObisCode(1, 0, 71, 7, 0, 255);
} 