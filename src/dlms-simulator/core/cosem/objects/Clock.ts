import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel } from '../data/Types';

/**
 * Clock Class (IC: 8)
 * Represents the internal clock of the device
 */
export class Clock extends CosemInterfaceClass {
    private time: Date;
    private timeZone: number; // in minutes from UTC
    private status: number;
    private daylightSavings: boolean;
    private clockBase: 'CRYSTAL' | 'LINE_FREQUENCY' = 'CRYSTAL';
    private validity: boolean;

    constructor(logicalName: ObisCode) {
        super(logicalName, 8);
        this.time = new Date();
        this.timeZone = 0;
        this.status = 0;
        this.daylightSavings = false;
        this.validity = true;
        this.initializeAttributes();
        this.startClock();
    }

    private initializeAttributes(): void {
        // Attribute 2: time
        this.addAttribute(2, {
            name: 'time',
            type: 'date-time',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.time,
            setValue: (value: Date) => {
                this.time = value;
            }
        });

        // Attribute 3: time_zone
        this.addAttribute(3, {
            name: 'time_zone',
            type: 'long',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.timeZone,
            setValue: (value: number) => {
                this.timeZone = value;
            }
        });

        // Attribute 4: status
        this.addAttribute(4, {
            name: 'status',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.status,
            setValue: (value: number) => {
                this.status = value;
            }
        });

        // Attribute 5: daylight_savings_begin
        this.addAttribute(5, {
            name: 'daylight_savings_begin',
            type: 'octet-string',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.getDaylightSavingsRules()?.begin || null
        });

        // Attribute 6: daylight_savings_end
        this.addAttribute(6, {
            name: 'daylight_savings_end',
            type: 'octet-string',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.getDaylightSavingsRules()?.end || null
        });

        // Attribute 7: daylight_savings_deviation
        this.addAttribute(7, {
            name: 'daylight_savings_deviation',
            type: 'integer',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.daylightSavings ? 60 : 0
        });

        // Attribute 8: daylight_savings_enabled
        this.addAttribute(8, {
            name: 'daylight_savings_enabled',
            type: 'boolean',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.daylightSavings,
            setValue: (value: boolean) => {
                this.daylightSavings = value;
            }
        });

        // Attribute 9: clock_base
        this.addAttribute(9, {
            name: 'clock_base',
            type: 'enum',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.clockBase === 'CRYSTAL' ? 0 : 1,
            setValue: (value: number) => {
                this.clockBase = value === 0 ? 'CRYSTAL' : 'LINE_FREQUENCY';
            }
        });
    }

    private startClock(): void {
        setInterval(() => {
            if (this.validity) {
                this.time = new Date();
            }
        }, 1000);
    }

    /**
     * Get the current time including timezone offset
     */
    public getCurrentTime(): Date {
        const time = new Date(this.time);
        time.setMinutes(time.getMinutes() + this.timeZone);
        if (this.daylightSavings) {
            time.setHours(time.getHours() + 1);
        }
        return time;
    }

    /**
     * Set the current time
     */
    public setTime(time: Date): void {
        this.time = time;
    }

    /**
     * Get the timezone offset in minutes
     */
    public getTimeZone(): number {
        return this.timeZone;
    }

    /**
     * Set the timezone offset in minutes
     */
    public setTimeZone(offset: number): void {
        this.timeZone = offset;
    }

    /**
     * Get the clock status
     */
    public getStatus(): number {
        return this.status;
    }

    /**
     * Set the clock status
     */
    public setStatus(status: number): void {
        this.status = status;
    }

    /**
     * Get daylight savings rules
     */
    private getDaylightSavingsRules() {
        // Default EU rules
        return {
            begin: Buffer.from([0x03, 0x00, 0x07, 0x1C, 0x02, 0x00, 0x00, 0x00]),
            end: Buffer.from([0x0A, 0x00, 0x07, 0x1C, 0x03, 0x00, 0x00, 0x00])
        };
    }

    /**
     * Set clock validity
     */
    public setValidity(valid: boolean): void {
        this.validity = valid;
    }

    /**
     * Get clock validity
     */
    public isValid(): boolean {
        return this.validity;
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return this.getCurrentTime().toISOString();
    }
} 