import { CosemInterfaceClass } from '../CosemInterfaceClass';
import { ObisCode } from '../ObisCode';
import { DataType } from '../types/DataType';
import { CalendarPlan, SeasonProfile, WeekProfile, DayProfile, DayProfileAction } from '../types/CalendarTypes';

/**
 * Activity Calendar Class (IC: 20)
 * This class is used for managing tariff schedules and seasons
 */
export class ActivityCalendar extends CosemInterfaceClass {
    private calendarName: string;
    private activePlan: CalendarPlan;
    private passivePlan: CalendarPlan;
    private activatePassiveTime?: Date;

    constructor(
        logicalName: ObisCode,
        calendarName: string = 'Default Calendar',
        initialPlan?: CalendarPlan
    ) {
        super(20, logicalName);
        this.calendarName = calendarName;

        // Initialize active plan
        this.activePlan = initialPlan || {
            name: 'Default Active Plan',
            seasonProfiles: [],
            weekProfiles: [],
            dayProfiles: []
        };

        // Initialize passive plan
        this.passivePlan = {
            name: 'Default Passive Plan',
            seasonProfiles: [],
            weekProfiles: [],
            dayProfiles: []
        };

        // Register class attributes
        this.registerAttribute(1, 'logical_name', DataType.OCTET_STRING, false);
        this.registerAttribute(2, 'calendar_name', DataType.STRING, true);
        this.registerAttribute(3, 'season_profile', DataType.ARRAY, true);
        this.registerAttribute(4, 'week_profile_table', DataType.ARRAY, true);
        this.registerAttribute(5, 'day_profile_table', DataType.ARRAY, true);
        this.registerAttribute(6, 'active_season_profile', DataType.ARRAY, false);
        this.registerAttribute(7, 'active_week_profile_table', DataType.ARRAY, false);
        this.registerAttribute(8, 'active_day_profile_table', DataType.ARRAY, false);
        this.registerAttribute(9, 'activate_passive_calendar_time', DataType.DATE_TIME, true);

        // Register class methods
        this.registerMethod(1, 'activate_passive_calendar');
    }

    /**
     * Get calendar name
     */
    public getCalendarName(): string {
        return this.calendarName;
    }

    /**
     * Set calendar name
     */
    public setCalendarName(name: string): void {
        this.calendarName = name;
    }

    /**
     * Get active plan
     */
    public getActivePlan(): CalendarPlan {
        return this.cloneCalendarPlan(this.activePlan);
    }

    /**
     * Get passive plan
     */
    public getPassivePlan(): CalendarPlan {
        return this.cloneCalendarPlan(this.passivePlan);
    }

    /**
     * Set passive plan
     */
    public setPassivePlan(plan: CalendarPlan): void {
        this.validateCalendarPlan(plan);
        this.passivePlan = this.cloneCalendarPlan(plan);
    }

    /**
     * Get activate passive time
     */
    public getActivatePassiveTime(): Date | undefined {
        return this.activatePassiveTime ? new Date(this.activatePassiveTime) : undefined;
    }

    /**
     * Set activate passive time
     */
    public setActivatePassiveTime(time: Date): void {
        this.activatePassiveTime = new Date(time);
    }

    /**
     * Activate passive calendar
     */
    public activatePassiveCalendar(): void {
        // Store current active plan as passive
        const oldActive = this.cloneCalendarPlan(this.activePlan);
        
        // Activate passive plan
        this.activePlan = this.cloneCalendarPlan(this.passivePlan);
        
        // Set old active as passive
        this.passivePlan = oldActive;
        
        // Clear activation time
        this.activatePassiveTime = undefined;
    }

    /**
     * Get current season
     */
    public getCurrentSeason(): SeasonProfile | undefined {
        const now = new Date();
        let currentSeason: SeasonProfile | undefined;
        let latestStart: Date | undefined;

        for (const season of this.activePlan.seasonProfiles) {
            const seasonStart = new Date(season.startDate);
            if (seasonStart <= now && (!latestStart || seasonStart > latestStart)) {
                latestStart = seasonStart;
                currentSeason = season;
            }
        }

        return currentSeason ? { ...currentSeason } : undefined;
    }

    /**
     * Get current day profile
     */
    public getCurrentDayProfile(): DayProfile | undefined {
        const currentSeason = this.getCurrentSeason();
        if (!currentSeason) return undefined;

        const currentWeek = this.activePlan.weekProfiles.find(w => w.weekName === currentSeason.weekName);
        if (!currentWeek) return undefined;

        const dayName = this.getDayProfileName(currentWeek);
        return this.activePlan.dayProfiles.find(d => d.dayId === dayName);
    }

    /**
     * Get current actions
     */
    public getCurrentActions(): DayProfileAction[] {
        const currentDayProfile = this.getCurrentDayProfile();
        if (!currentDayProfile) return [];

        const now = new Date();
        const currentTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return currentDayProfile.actions.filter(action => {
            const actionTime = new Date(action.startTime);
            actionTime.setFullYear(currentTime.getFullYear());
            actionTime.setMonth(currentTime.getMonth());
            actionTime.setDate(currentTime.getDate());
            return actionTime <= now;
        });
    }

    /**
     * Clone calendar plan
     */
    private cloneCalendarPlan(plan: CalendarPlan): CalendarPlan {
        return {
            name: plan.name,
            seasonProfiles: plan.seasonProfiles.map(s => ({ ...s, startDate: new Date(s.startDate) })),
            weekProfiles: plan.weekProfiles.map(w => ({ ...w })),
            dayProfiles: plan.dayProfiles.map(d => ({
                dayId: d.dayId,
                actions: d.actions.map(a => ({
                    startTime: new Date(a.startTime),
                    scriptLogicalName: [...a.scriptLogicalName],
                    scriptSelector: a.scriptSelector
                }))
            })),
            activateTime: plan.activateTime ? new Date(plan.activateTime) : undefined
        };
    }

    /**
     * Validate calendar plan
     */
    private validateCalendarPlan(plan: CalendarPlan): void {
        if (!plan.name) {
            throw new Error('Calendar plan must have a name');
        }

        // Validate season profiles
        if (!Array.isArray(plan.seasonProfiles)) {
            throw new Error('Season profiles must be an array');
        }
        for (const season of plan.seasonProfiles) {
            if (!season.seasonName || !season.startDate || !season.weekName) {
                throw new Error('Invalid season profile');
            }
            if (!plan.weekProfiles.some(w => w.weekName === season.weekName)) {
                throw new Error(`Week profile ${season.weekName} not found`);
            }
        }

        // Validate week profiles
        if (!Array.isArray(plan.weekProfiles)) {
            throw new Error('Week profiles must be an array');
        }
        for (const week of plan.weekProfiles) {
            if (!week.weekName || !week.monday || !week.tuesday || !week.wednesday ||
                !week.thursday || !week.friday || !week.saturday || !week.sunday) {
                throw new Error('Invalid week profile');
            }
        }

        // Validate day profiles
        if (!Array.isArray(plan.dayProfiles)) {
            throw new Error('Day profiles must be an array');
        }
        for (const day of plan.dayProfiles) {
            if (!day.dayId || !Array.isArray(day.actions)) {
                throw new Error('Invalid day profile');
            }
            for (const action of day.actions) {
                if (!action.startTime || !Array.isArray(action.scriptLogicalName) ||
                    typeof action.scriptSelector !== 'number') {
                    throw new Error('Invalid day profile action');
                }
            }
        }
    }

    /**
     * Get day profile name based on current day
     */
    private getDayProfileName(weekProfile: WeekProfile): string {
        const day = new Date().getDay();
        switch (day) {
            case 0: return weekProfile.sunday;
            case 1: return weekProfile.monday;
            case 2: return weekProfile.tuesday;
            case 3: return weekProfile.wednesday;
            case 4: return weekProfile.thursday;
            case 5: return weekProfile.friday;
            case 6: return weekProfile.saturday;
            default: throw new Error('Invalid day of week');
        }
    }

    /**
     * Handle get request
     */
    protected handleGet(attributeId: number): any {
        switch (attributeId) {
            case 1:
                return this.getLogicalName().toBuffer();
            case 2:
                return this.getCalendarName();
            case 3:
                return this.passivePlan.seasonProfiles;
            case 4:
                return this.passivePlan.weekProfiles;
            case 5:
                return this.passivePlan.dayProfiles;
            case 6:
                return this.activePlan.seasonProfiles;
            case 7:
                return this.activePlan.weekProfiles;
            case 8:
                return this.activePlan.dayProfiles;
            case 9:
                return this.getActivatePassiveTime();
            default:
                throw new Error(`Invalid attribute id ${attributeId} for ActivityCalendar class`);
        }
    }

    /**
     * Handle set request
     */
    protected handleSet(attributeId: number, value: any): void {
        switch (attributeId) {
            case 1:
                throw new Error('Logical name is read-only');
            case 2:
                if (typeof value !== 'string') {
                    throw new Error('Calendar name must be a string');
                }
                this.setCalendarName(value);
                break;
            case 3:
                if (!Array.isArray(value)) {
                    throw new Error('Season profiles must be an array');
                }
                this.passivePlan.seasonProfiles = value;
                break;
            case 4:
                if (!Array.isArray(value)) {
                    throw new Error('Week profiles must be an array');
                }
                this.passivePlan.weekProfiles = value;
                break;
            case 5:
                if (!Array.isArray(value)) {
                    throw new Error('Day profiles must be an array');
                }
                this.passivePlan.dayProfiles = value;
                break;
            case 6:
            case 7:
            case 8:
                throw new Error('Active calendar attributes are read-only');
            case 9:
                if (!(value instanceof Date)) {
                    throw new Error('Activate passive time must be a Date object');
                }
                this.setActivatePassiveTime(value);
                break;
            default:
                throw new Error(`Invalid attribute id ${attributeId} for ActivityCalendar class`);
        }
    }

    /**
     * Handle action request
     */
    protected handleAction(methodId: number): void {
        switch (methodId) {
            case 1: // activate_passive_calendar
                this.activatePassiveCalendar();
                break;
            default:
                throw new Error(`Invalid method id ${methodId} for ActivityCalendar class`);
        }
    }
} 