"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clock = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const Types_1 = require("../data/Types");
/**
 * Clock Class (IC: 8)
 * Represents the internal clock of the device
 */
class Clock extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName) {
        super(logicalName, 8);
        this.clockBase = 'CRYSTAL';
        this.time = new Date();
        this.timeZone = 0;
        this.status = 0;
        this.daylightSavings = false;
        this.validity = true;
        this.initializeAttributes();
        this.startClock();
    }
    initializeAttributes() {
        // Attribute 2: time
        this.addAttribute(2, {
            name: 'time',
            type: 'date-time',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.time,
            setValue: (value) => {
                this.time = value;
            }
        });
        // Attribute 3: time_zone
        this.addAttribute(3, {
            name: 'time_zone',
            type: 'long',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.timeZone,
            setValue: (value) => {
                this.timeZone = value;
            }
        });
        // Attribute 4: status
        this.addAttribute(4, {
            name: 'status',
            type: 'unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.status,
            setValue: (value) => {
                this.status = value;
            }
        });
        // Attribute 5: daylight_savings_begin
        this.addAttribute(5, {
            name: 'daylight_savings_begin',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.getDaylightSavingsRules()?.begin || null
        });
        // Attribute 6: daylight_savings_end
        this.addAttribute(6, {
            name: 'daylight_savings_end',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.getDaylightSavingsRules()?.end || null
        });
        // Attribute 7: daylight_savings_deviation
        this.addAttribute(7, {
            name: 'daylight_savings_deviation',
            type: 'integer',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.daylightSavings ? 60 : 0
        });
        // Attribute 8: daylight_savings_enabled
        this.addAttribute(8, {
            name: 'daylight_savings_enabled',
            type: 'boolean',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.daylightSavings,
            setValue: (value) => {
                this.daylightSavings = value;
            }
        });
        // Attribute 9: clock_base
        this.addAttribute(9, {
            name: 'clock_base',
            type: 'enum',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.clockBase === 'CRYSTAL' ? 0 : 1,
            setValue: (value) => {
                this.clockBase = value === 0 ? 'CRYSTAL' : 'LINE_FREQUENCY';
            }
        });
    }
    startClock() {
        setInterval(() => {
            if (this.validity) {
                this.time = new Date();
            }
        }, 1000);
    }
    /**
     * Get the current time including timezone offset
     */
    getCurrentTime() {
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
    setTime(time) {
        this.time = time;
    }
    /**
     * Get the timezone offset in minutes
     */
    getTimeZone() {
        return this.timeZone;
    }
    /**
     * Set the timezone offset in minutes
     */
    setTimeZone(offset) {
        this.timeZone = offset;
    }
    /**
     * Get the clock status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Set the clock status
     */
    setStatus(status) {
        this.status = status;
    }
    /**
     * Get daylight savings rules
     */
    getDaylightSavingsRules() {
        // Default EU rules
        return {
            begin: Buffer.from([0x03, 0x00, 0x07, 0x1C, 0x02, 0x00, 0x00, 0x00]),
            end: Buffer.from([0x0A, 0x00, 0x07, 0x1C, 0x03, 0x00, 0x00, 0x00])
        };
    }
    /**
     * Set clock validity
     */
    setValidity(valid) {
        this.validity = valid;
    }
    /**
     * Get clock validity
     */
    isValid() {
        return this.validity;
    }
    /**
     * Convert to string representation
     */
    toString() {
        return this.getCurrentTime().toISOString();
    }
}
exports.Clock = Clock;
