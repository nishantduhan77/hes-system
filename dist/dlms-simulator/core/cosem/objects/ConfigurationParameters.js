"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationParameters = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const ObisCode_1 = require("../obis/ObisCode");
const Types_1 = require("../data/Types");
/**
 * Configuration Parameters Class
 * Implements configurable parameters for meter configuration
 */
class ConfigurationParameters extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor() {
        super(ObisCode_1.ObisCode.fromString('0.0.96.1.0.255'), 1);
        // RTC Date and Time
        this.rtcDateTime = new Date();
        // Integration Periods
        this.demandIntegrationPeriod = 1800; // Default 30 minutes (1800 seconds)
        this.profileCapturePeriod = 1800; // Default 30 minutes
        // Billing Schedule
        this.billingDate = 1; // Default 1st of every month
        // Active/Passive Calendar
        this.activeCalendar = new CalendarConfig();
        this.passiveCalendar = new CalendarConfig();
        // Other Parameters
        this.meterMode = 0;
        this.displayTime = 10; // Default 10 seconds
        this.hlsSecret = '';
        this.globalKeyChange = 0;
        this.kw1 = 0;
        this.md = 0;
        this.pushConfig = new PushConfiguration();
        this.ipConfig = new IPConfiguration();
        this.ptRatio = 1;
        this.ctRatio = 1;
        this.apparentEnergyConfig = 0;
        this.initializeAttributes();
    }
    initializeAttributes() {
        // RTC Date and Time (OBIS: 0.0.1.0.0.255)
        this.addAttribute(2, {
            name: 'rtc_date_time',
            type: 'date-time',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.rtcDateTime,
            setValue: (value) => { this.rtcDateTime = value; }
        });
        // Demand Integration Period (OBIS: 1.0.0.8.0.255)
        this.addAttribute(3, {
            name: 'demand_integration_period',
            type: 'long-unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.demandIntegrationPeriod,
            setValue: (value) => {
                // Validate: 900 (15min) & 1800 (30min) seconds
                if (value === 900 || value === 1800) {
                    this.demandIntegrationPeriod = value;
                }
                else {
                    throw new Error('Invalid demand integration period. Must be 900 or 1800 seconds.');
                }
            }
        });
        // Profile Capture Period (OBIS: 1.0.0.8.1.255)
        this.addAttribute(4, {
            name: 'profile_capture_period',
            type: 'long-unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.profileCapturePeriod,
            setValue: (value) => {
                // Default value is 1800
                this.profileCapturePeriod = value;
            }
        });
        // Billing Date (OBIS: 0.0.0.1.2.255)
        this.addAttribute(5, {
            name: 'billing_date',
            type: 'unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.billingDate,
            setValue: (value) => {
                if (value >= 1 && value <= 31) {
                    this.billingDate = value;
                }
                else {
                    throw new Error('Invalid billing date. Must be between 1 and 31.');
                }
            }
        });
        // Active Calendar (OBIS: 0.0.13.0.0.255)
        this.addAttribute(6, {
            name: 'active_calendar',
            type: 'structure',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.activeCalendar.toArray(),
            setValue: (value) => { this.activeCalendar.fromArray(value); }
        });
        // Passive Calendar (OBIS: 0.0.13.0.0.255)
        this.addAttribute(7, {
            name: 'passive_calendar',
            type: 'structure',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.passiveCalendar.toArray(),
            setValue: (value) => { this.passiveCalendar.fromArray(value); }
        });
        // Meter Mode (OBIS: 0.0.94.96.19.255)
        this.addAttribute(8, {
            name: 'meter_mode',
            type: 'unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.meterMode,
            setValue: (value) => { this.meterMode = value; }
        });
        // Display Time (OBIS: 0.0.94.91.10.255)
        this.addAttribute(9, {
            name: 'display_time',
            type: 'unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.displayTime,
            setValue: (value) => { this.displayTime = value; }
        });
        // HLS Secret (OBIS: 0.0.40.0.2.255)
        this.addAttribute(10, {
            name: 'hls_secret',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.hlsSecret,
            setValue: (value) => { this.hlsSecret = value; }
        });
        // Push Configuration (OBIS: 0.0.25.9.0.255)
        this.addAttribute(11, {
            name: 'push_config',
            type: 'structure',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.pushConfig.toArray(),
            setValue: (value) => { this.pushConfig.fromArray(value); }
        });
        // IP Configuration (OBIS: 0.0.25.1.0.255)
        this.addAttribute(12, {
            name: 'ip_config',
            type: 'structure',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.ipConfig.toArray(),
            setValue: (value) => { this.ipConfig.fromArray(value); }
        });
        // PT Ratio (OBIS: 1.0.0.4.2.255)
        this.addAttribute(13, {
            name: 'pt_ratio',
            type: 'long-unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.ptRatio,
            setValue: (value) => { this.ptRatio = value; }
        });
        // CT Ratio (OBIS: 1.0.0.4.3.255)
        this.addAttribute(14, {
            name: 'ct_ratio',
            type: 'long-unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.ctRatio,
            setValue: (value) => { this.ctRatio = value; }
        });
        // Apparent Energy Configuration (OBIS: 0.128.152.129.129.255)
        this.addAttribute(15, {
            name: 'apparent_energy_config',
            type: 'unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.apparentEnergyConfig,
            setValue: (value) => { this.apparentEnergyConfig = value; }
        });
    }
    toString() {
        return `ConfigurationParameters [DIP: ${this.demandIntegrationPeriod}s, PCP: ${this.profileCapturePeriod}s, Billing Date: ${this.billingDate}]`;
    }
}
exports.ConfigurationParameters = ConfigurationParameters;
/**
 * Calendar Configuration Class
 * Handles both Active and Passive calendar configurations
 */
class CalendarConfig {
    constructor() {
        this.seasons = [];
        this.weekProfiles = [];
        this.dayProfiles = [];
    }
    toArray() {
        return [
            this.seasons.map(s => s.toArray()),
            this.weekProfiles.map(w => w.toArray()),
            this.dayProfiles.map(d => d.toArray())
        ];
    }
    fromArray(data) {
        if (data.length === 3) {
            this.seasons = data[0].map((s) => SeasonProfile.fromArray(s));
            this.weekProfiles = data[1].map((w) => WeekProfile.fromArray(w));
            this.dayProfiles = data[2].map((d) => DayProfile.fromArray(d));
        }
    }
}
class SeasonProfile {
    constructor(name, startTime, weekProfileName) {
        this.name = name;
        this.startTime = startTime;
        this.weekProfileName = weekProfileName;
    }
    toArray() {
        return [this.name, this.startTime, this.weekProfileName];
    }
    static fromArray(data) {
        return new SeasonProfile(data[0], data[1], data[2]);
    }
}
class WeekProfile {
    constructor(name, monday, tuesday, wednesday, thursday, friday, saturday, sunday) {
        this.name = name;
        this.monday = monday;
        this.tuesday = tuesday;
        this.wednesday = wednesday;
        this.thursday = thursday;
        this.friday = friday;
        this.saturday = saturday;
        this.sunday = sunday;
    }
    toArray() {
        return [
            this.name,
            this.monday,
            this.tuesday,
            this.wednesday,
            this.thursday,
            this.friday,
            this.saturday,
            this.sunday
        ];
    }
    static fromArray(data) {
        return new WeekProfile(data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7]);
    }
}
class DayProfile {
    constructor(name, schedules) {
        this.name = name;
        this.schedules = schedules;
    }
    toArray() {
        return [this.name, this.schedules.map(s => s.toArray())];
    }
    static fromArray(data) {
        return new DayProfile(data[0], data[1].map((s) => DaySchedule.fromArray(s)));
    }
}
class DaySchedule {
    constructor(startTime, script) {
        this.startTime = startTime;
        this.script = script;
    }
    toArray() {
        return [this.startTime, this.script];
    }
    static fromArray(data) {
        return new DaySchedule(data[0], data[1]);
    }
}
/**
 * Push Configuration Class
 * Handles push configuration parameters
 */
class PushConfiguration {
    constructor(destination = '', interval = 900, // Default 15 minutes
    randomization = 60, // Default 1 minute
    retries = 3, retryTimeout = 30 // Default 30 seconds
    ) {
        this.destination = destination;
        this.interval = interval;
        this.randomization = randomization;
        this.retries = retries;
        this.retryTimeout = retryTimeout;
    }
    toArray() {
        return [
            this.destination,
            this.interval,
            this.randomization,
            this.retries,
            this.retryTimeout
        ];
    }
    fromArray(data) {
        if (data.length === 5) {
            [
                this.destination,
                this.interval,
                this.randomization,
                this.retries,
                this.retryTimeout
            ] = data;
        }
    }
}
/**
 * IP Configuration Class
 * Handles IP configuration parameters
 */
class IPConfiguration {
    constructor(ipAddress = '', subnetMask = '', gateway = '', primaryDNS = '', secondaryDNS = '') {
        this.ipAddress = ipAddress;
        this.subnetMask = subnetMask;
        this.gateway = gateway;
        this.primaryDNS = primaryDNS;
        this.secondaryDNS = secondaryDNS;
    }
    toArray() {
        return [
            this.ipAddress,
            this.subnetMask,
            this.gateway,
            this.primaryDNS,
            this.secondaryDNS
        ];
    }
    fromArray(data) {
        if (data.length === 5) {
            [
                this.ipAddress,
                this.subnetMask,
                this.gateway,
                this.primaryDNS,
                this.secondaryDNS
            ] = data;
        }
    }
}
