import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel } from '../data/Types';

/**
 * Activity Calendar Class (IC: 20)
 * Manages Time-of-Use (TOU) tariff schedules
 * OBIS: 0.0.13.0.0.255 (Active Calendar), 0.0.14.0.0.255 (Passive Calendar)
 */
export class ActivityCalendar extends CosemInterfaceClass {
    private calendarNameActive: string = 'Active Calendar';
    private calendarNamePassive: string = 'Passive Calendar';
    private seasonProfileActive: SeasonProfile[] = [];
    private seasonProfilePassive: SeasonProfile[] = [];
    private weekProfileTableActive: WeekProfile[] = [];
    private weekProfileTablePassive: WeekProfile[] = [];
    private dayProfileTableActive: DayProfile[] = [];
    private dayProfileTablePassive: DayProfile[] = [];
    private activatePassiveCalendarTime: Date = new Date();
    private calendarEntriesActive: CalendarEntry[] = [];
    private calendarEntriesPassive: CalendarEntry[] = [];

    constructor(isActive: boolean = true) {
        const obisCode = isActive ? '0.0.13.0.0.255' : '0.0.14.0.0.255';
        super(ObisCode.fromString(obisCode), 20);
        this.initializeAttributes();
        this.initializeMethods();
        this.initializeDefaultProfiles();
    }

    private initializeAttributes(): void {
        // Attribute 2: calendar_name_active (octet-string)
        this.addAttribute(2, {
            name: 'calendar_name_active',
            type: 'octet-string',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.calendarNameActive,
            setValue: (value: string) => { this.calendarNameActive = value; }
        });

        // Attribute 3: season_profile_active (array)
        this.addAttribute(3, {
            name: 'season_profile_active',
            type: 'array',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.seasonProfileActive,
            setValue: (value: SeasonProfile[]) => { this.seasonProfileActive = value; }
        });

        // Attribute 4: week_profile_table_active (array)
        this.addAttribute(4, {
            name: 'week_profile_table_active',
            type: 'array',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.weekProfileTableActive,
            setValue: (value: WeekProfile[]) => { this.weekProfileTableActive = value; }
        });

        // Attribute 5: day_profile_table_active (array)
        this.addAttribute(5, {
            name: 'day_profile_table_active',
            type: 'array',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.dayProfileTableActive,
            setValue: (value: DayProfile[]) => { this.dayProfileTableActive = value; }
        });

        // Attribute 6: calendar_name_passive (octet-string)
        this.addAttribute(6, {
            name: 'calendar_name_passive',
            type: 'octet-string',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.calendarNamePassive,
            setValue: (value: string) => { this.calendarNamePassive = value; }
        });

        // Attribute 7: season_profile_passive (array)
        this.addAttribute(7, {
            name: 'season_profile_passive',
            type: 'array',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.seasonProfilePassive,
            setValue: (value: SeasonProfile[]) => { this.seasonProfilePassive = value; }
        });

        // Attribute 8: week_profile_table_passive (array)
        this.addAttribute(8, {
            name: 'week_profile_table_passive',
            type: 'array',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.weekProfileTablePassive,
            setValue: (value: WeekProfile[]) => { this.weekProfileTablePassive = value; }
        });

        // Attribute 9: day_profile_table_passive (array)
        this.addAttribute(9, {
            name: 'day_profile_table_passive',
            type: 'array',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.dayProfileTablePassive,
            setValue: (value: DayProfile[]) => { this.dayProfileTablePassive = value; }
        });

        // Attribute 10: activate_passive_calendar_time (date-time)
        this.addAttribute(10, {
            name: 'activate_passive_calendar_time',
            type: 'date-time',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.activatePassiveCalendarTime,
            setValue: (value: Date) => { this.activatePassiveCalendarTime = value; }
        });
    }

    private initializeMethods(): void {
        // Method 1: activate_passive_calendar()
        this.addMethod(1, {
            name: 'activate_passive_calendar',
            execute: () => {
                // Swap active and passive calendars
                const tempName = this.calendarNameActive;
                this.calendarNameActive = this.calendarNamePassive;
                this.calendarNamePassive = tempName;

                const tempSeason = this.seasonProfileActive;
                this.seasonProfileActive = this.seasonProfilePassive;
                this.seasonProfilePassive = tempSeason;

                const tempWeek = this.weekProfileTableActive;
                this.weekProfileTableActive = this.weekProfileTablePassive;
                this.weekProfileTablePassive = tempWeek;

                const tempDay = this.dayProfileTableActive;
                this.dayProfileTableActive = this.dayProfileTablePassive;
                this.dayProfileTablePassive = tempDay;

                return { success: true, message: 'Passive calendar activated' };
            }
        });

        // Method 2: add_season_profile()
        this.addMethod(2, {
            name: 'add_season_profile',
            execute: (profile: SeasonProfile) => {
                this.seasonProfileActive.push(profile);
                return { success: true, message: 'Season profile added' };
            }
        });

        // Method 3: add_week_profile()
        this.addMethod(3, {
            name: 'add_week_profile',
            execute: (profile: WeekProfile) => {
                this.weekProfileTableActive.push(profile);
                return { success: true, message: 'Week profile added' };
            }
        });

        // Method 4: add_day_profile()
        this.addMethod(4, {
            name: 'add_day_profile',
            execute: (profile: DayProfile) => {
                this.dayProfileTableActive.push(profile);
                return { success: true, message: 'Day profile added' };
            }
        });

        // Method 5: get_current_tariff()
        this.addMethod(5, {
            name: 'get_current_tariff',
            execute: () => {
                const now = new Date();
                return this.getTariffForDateTime(now);
            }
        });
    }

    private initializeDefaultProfiles(): void {
        // Default season profiles
        this.seasonProfileActive = [
            { seasonProfileName: 'Summer', seasonStart: '06-01', weekName: 'Summer Week' },
            { seasonProfileName: 'Winter', seasonStart: '12-01', weekName: 'Winter Week' }
        ];

        // Default week profiles
        this.weekProfileTableActive = [
            { weekProfileName: 'Summer Week', monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 2, sunday: 2 },
            { weekProfileName: 'Winter Week', monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 2, sunday: 2 }
        ];

        // Default day profiles
        this.dayProfileTableActive = [
            { dayId: 1, daySchedules: [
                { start: '00:00', tariff: 1 },
                { start: '06:00', tariff: 2 },
                { start: '18:00', tariff: 1 },
                { start: '22:00', tariff: 3 }
            ]},
            { dayId: 2, daySchedules: [
                { start: '00:00', tariff: 3 },
                { start: '06:00', tariff: 3 },
                { start: '18:00', tariff: 3 },
                { start: '22:00', tariff: 3 }
            ]}
        ];
    }

    /**
     * Get tariff for a specific date and time
     */
    public getTariffForDateTime(dateTime: Date): number {
        // Find current season
        const currentSeason = this.findCurrentSeason(dateTime);
        if (!currentSeason) return 1; // Default tariff

        // Find current week profile
        const weekProfile = this.weekProfileTableActive.find(wp => wp.weekProfileName === currentSeason.weekName);
        if (!weekProfile) return 1;

        // Get day ID for current day of week
        const dayOfWeek = dateTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
        let dayId: number;
        switch (dayOfWeek) {
            case 0: dayId = weekProfile.sunday; break;
            case 1: dayId = weekProfile.monday; break;
            case 2: dayId = weekProfile.tuesday; break;
            case 3: dayId = weekProfile.wednesday; break;
            case 4: dayId = weekProfile.thursday; break;
            case 5: dayId = weekProfile.friday; break;
            case 6: dayId = weekProfile.saturday; break;
            default: dayId = 1;
        }

        // Find day profile
        const dayProfile = this.dayProfileTableActive.find(dp => dp.dayId === dayId);
        if (!dayProfile) return 1;

        // Find current tariff based on time
        const timeString = dateTime.toTimeString().substring(0, 5); // HH:MM format
        for (let i = dayProfile.daySchedules.length - 1; i >= 0; i--) {
            if (timeString >= dayProfile.daySchedules[i].start) {
                return dayProfile.daySchedules[i].tariff;
            }
        }

        return 1; // Default tariff
    }

    /**
     * Find current season based on date
     */
    private findCurrentSeason(dateTime: Date): SeasonProfile | null {
        const currentDate = dateTime.toISOString().substring(5, 10); // MM-DD format
        
        for (const season of this.seasonProfileActive) {
            if (currentDate >= season.seasonStart) {
                return season;
            }
        }
        
        // If no season found, return the first one
        return this.seasonProfileActive.length > 0 ? this.seasonProfileActive[0] : null;
    }

    /**
     * Get current tariff description
     */
    public getCurrentTariffDescription(): string {
        const tariff = this.getTariffForDateTime(new Date());
        switch (tariff) {
            case 1: return 'Normal Rate';
            case 2: return 'Peak Rate';
            case 3: return 'Off-Peak Rate';
            default: return 'Unknown Rate';
        }
    }

    /**
     * Get all season profiles
     */
    public getSeasonProfiles(): SeasonProfile[] {
        return this.seasonProfileActive;
    }

    /**
     * Get all week profiles
     */
    public getWeekProfiles(): WeekProfile[] {
        return this.weekProfileTableActive;
    }

    /**
     * Get all day profiles
     */
    public getDayProfiles(): DayProfile[] {
        return this.dayProfileTableActive;
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `Activity Calendar (${this.calendarNameActive}) - Current Tariff: ${this.getCurrentTariffDescription()}`;
    }
}

// Supporting interfaces
interface SeasonProfile {
    seasonProfileName: string;
    seasonStart: string; // MM-DD format
    weekName: string;
}

interface WeekProfile {
    weekProfileName: string;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
}

interface DayProfile {
    dayId: number;
    daySchedules: DaySchedule[];
}

interface DaySchedule {
    start: string; // HH:MM format
    tariff: number;
}

interface CalendarEntry {
    date: Date;
    tariff: number;
    description: string;
} 