import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel, Unit } from '../data/Types';

/**
 * Configuration Parameters Class
 * Implements configurable parameters for meter configuration
 */
export class ConfigurationParameters extends CosemInterfaceClass {
    // RTC Date and Time
    private rtcDateTime: Date = new Date();
    
    // Integration Periods
    private demandIntegrationPeriod: number = 1800; // Default 30 minutes (1800 seconds)
    private profileCapturePeriod: number = 1800; // Default 30 minutes
    
    // Billing Schedule
    private billingDate: number = 1; // Default 1st of every month
    
    // Active/Passive Calendar
    private activeCalendar: CalendarConfig = new CalendarConfig();
    private passiveCalendar: CalendarConfig = new CalendarConfig();
    
    // Other Parameters
    private meterMode: number = 0;
    private displayTime: number = 10; // Default 10 seconds
    private hlsSecret: string = '';
    private globalKeyChange: number = 0;
    private kw1: number = 0;
    private md: number = 0;
    private pushConfig: PushConfiguration = new PushConfiguration();
    private ipConfig: IPConfiguration = new IPConfiguration();
    private ptRatio: number = 1;
    private ctRatio: number = 1;
    private apparentEnergyConfig: number = 0;

    constructor() {
        super(ObisCode.fromString('0.0.96.1.0.255'), 1);
        this.initializeAttributes();
    }

    private initializeAttributes(): void {
        // RTC Date and Time (OBIS: 0.0.1.0.0.255)
        this.addAttribute(2, {
            name: 'rtc_date_time',
            type: 'date-time',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.rtcDateTime,
            setValue: (value: Date) => { this.rtcDateTime = value; }
        });

        // Demand Integration Period (OBIS: 1.0.0.8.0.255)
        this.addAttribute(3, {
            name: 'demand_integration_period',
            type: 'long-unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.demandIntegrationPeriod,
            setValue: (value: number) => {
                // Validate: 900 (15min) & 1800 (30min) seconds
                if (value === 900 || value === 1800) {
                    this.demandIntegrationPeriod = value;
                } else {
                    throw new Error('Invalid demand integration period. Must be 900 or 1800 seconds.');
                }
            }
        });

        // Profile Capture Period (OBIS: 1.0.0.8.1.255)
        this.addAttribute(4, {
            name: 'profile_capture_period',
            type: 'long-unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.profileCapturePeriod,
            setValue: (value: number) => {
                // Default value is 1800
                this.profileCapturePeriod = value;
            }
        });

        // Billing Date (OBIS: 0.0.0.1.2.255)
        this.addAttribute(5, {
            name: 'billing_date',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.billingDate,
            setValue: (value: number) => {
                if (value >= 1 && value <= 31) {
                    this.billingDate = value;
                } else {
                    throw new Error('Invalid billing date. Must be between 1 and 31.');
                }
            }
        });

        // Active Calendar (OBIS: 0.0.13.0.0.255)
        this.addAttribute(6, {
            name: 'active_calendar',
            type: 'structure',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.activeCalendar.toArray(),
            setValue: (value: any[]) => { this.activeCalendar.fromArray(value); }
        });

        // Passive Calendar (OBIS: 0.0.13.0.0.255)
        this.addAttribute(7, {
            name: 'passive_calendar',
            type: 'structure',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.passiveCalendar.toArray(),
            setValue: (value: any[]) => { this.passiveCalendar.fromArray(value); }
        });

        // Meter Mode (OBIS: 0.0.94.96.19.255)
        this.addAttribute(8, {
            name: 'meter_mode',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.meterMode,
            setValue: (value: number) => { this.meterMode = value; }
        });

        // Display Time (OBIS: 0.0.94.91.10.255)
        this.addAttribute(9, {
            name: 'display_time',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.displayTime,
            setValue: (value: number) => { this.displayTime = value; }
        });

        // HLS Secret (OBIS: 0.0.40.0.2.255)
        this.addAttribute(10, {
            name: 'hls_secret',
            type: 'octet-string',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.hlsSecret,
            setValue: (value: string) => { this.hlsSecret = value; }
        });

        // Push Configuration (OBIS: 0.0.25.9.0.255)
        this.addAttribute(11, {
            name: 'push_config',
            type: 'structure',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.pushConfig.toArray(),
            setValue: (value: any[]) => { this.pushConfig.fromArray(value); }
        });

        // IP Configuration (OBIS: 0.0.25.1.0.255)
        this.addAttribute(12, {
            name: 'ip_config',
            type: 'structure',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.ipConfig.toArray(),
            setValue: (value: any[]) => { this.ipConfig.fromArray(value); }
        });

        // PT Ratio (OBIS: 1.0.0.4.2.255)
        this.addAttribute(13, {
            name: 'pt_ratio',
            type: 'long-unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.ptRatio,
            setValue: (value: number) => { this.ptRatio = value; }
        });

        // CT Ratio (OBIS: 1.0.0.4.3.255)
        this.addAttribute(14, {
            name: 'ct_ratio',
            type: 'long-unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.ctRatio,
            setValue: (value: number) => { this.ctRatio = value; }
        });

        // Apparent Energy Configuration (OBIS: 0.128.152.129.129.255)
        this.addAttribute(15, {
            name: 'apparent_energy_config',
            type: 'unsigned',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.apparentEnergyConfig,
            setValue: (value: number) => { this.apparentEnergyConfig = value; }
        });
    }

    public toString(): string {
        return `ConfigurationParameters [DIP: ${this.demandIntegrationPeriod}s, PCP: ${this.profileCapturePeriod}s, Billing Date: ${this.billingDate}]`;
    }
}

/**
 * Calendar Configuration Class
 * Handles both Active and Passive calendar configurations
 */
class CalendarConfig {
    private seasons: SeasonProfile[] = [];
    private weekProfiles: WeekProfile[] = [];
    private dayProfiles: DayProfile[] = [];

    public toArray(): any[] {
        return [
            this.seasons.map(s => s.toArray()),
            this.weekProfiles.map(w => w.toArray()),
            this.dayProfiles.map(d => d.toArray())
        ];
    }

    public fromArray(data: any[]): void {
        if (data.length === 3) {
            this.seasons = data[0].map((s: any[]) => SeasonProfile.fromArray(s));
            this.weekProfiles = data[1].map((w: any[]) => WeekProfile.fromArray(w));
            this.dayProfiles = data[2].map((d: any[]) => DayProfile.fromArray(d));
        }
    }
}

class SeasonProfile {
    constructor(
        public name: string,
        public startTime: Date,
        public weekProfileName: string
    ) {}

    public toArray(): any[] {
        return [this.name, this.startTime, this.weekProfileName];
    }

    public static fromArray(data: any[]): SeasonProfile {
        return new SeasonProfile(data[0], data[1], data[2]);
    }
}

class WeekProfile {
    constructor(
        public name: string,
        public monday: string,
        public tuesday: string,
        public wednesday: string,
        public thursday: string,
        public friday: string,
        public saturday: string,
        public sunday: string
    ) {}

    public toArray(): any[] {
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

    public static fromArray(data: any[]): WeekProfile {
        return new WeekProfile(
            data[0], data[1], data[2], data[3],
            data[4], data[5], data[6], data[7]
        );
    }
}

class DayProfile {
    constructor(
        public name: string,
        public schedules: DaySchedule[]
    ) {}

    public toArray(): any[] {
        return [this.name, this.schedules.map(s => s.toArray())];
    }

    public static fromArray(data: any[]): DayProfile {
        return new DayProfile(
            data[0],
            data[1].map((s: any[]) => DaySchedule.fromArray(s))
        );
    }
}

class DaySchedule {
    constructor(
        public startTime: string,
        public script: string
    ) {}

    public toArray(): any[] {
        return [this.startTime, this.script];
    }

    public static fromArray(data: any[]): DaySchedule {
        return new DaySchedule(data[0], data[1]);
    }
}

/**
 * Push Configuration Class
 * Handles push configuration parameters
 */
class PushConfiguration {
    constructor(
        public destination: string = '',
        public interval: number = 900, // Default 15 minutes
        public randomization: number = 60, // Default 1 minute
        public retries: number = 3,
        public retryTimeout: number = 30 // Default 30 seconds
    ) {}

    public toArray(): any[] {
        return [
            this.destination,
            this.interval,
            this.randomization,
            this.retries,
            this.retryTimeout
        ];
    }

    public fromArray(data: any[]): void {
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
    constructor(
        public ipAddress: string = '',
        public subnetMask: string = '',
        public gateway: string = '',
        public primaryDNS: string = '',
        public secondaryDNS: string = ''
    ) {}

    public toArray(): any[] {
        return [
            this.ipAddress,
            this.subnetMask,
            this.gateway,
            this.primaryDNS,
            this.secondaryDNS
        ];
    }

    public fromArray(data: any[]): void {
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