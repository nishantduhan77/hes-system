"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityCalendar = void 0;
const CosemInterfaceClass_1 = require("../CosemInterfaceClass");
const DataType_1 = require("../types/DataType");
/**
 * Activity Calendar Class (IC: 20)
 * This class is used for managing tariff schedules and seasons
 */
class ActivityCalendar extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, calendarName = 'Default Calendar', initialPlan) {
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
        this.registerAttribute(1, 'logical_name', DataType_1.DataType.OCTET_STRING, false);
        this.registerAttribute(2, 'calendar_name', DataType_1.DataType.STRING, true);
        this.registerAttribute(3, 'season_profile', DataType_1.DataType.ARRAY, true);
        this.registerAttribute(4, 'week_profile_table', DataType_1.DataType.ARRAY, true);
        this.registerAttribute(5, 'day_profile_table', DataType_1.DataType.ARRAY, true);
        this.registerAttribute(6, 'active_season_profile', DataType_1.DataType.ARRAY, false);
        this.registerAttribute(7, 'active_week_profile_table', DataType_1.DataType.ARRAY, false);
        this.registerAttribute(8, 'active_day_profile_table', DataType_1.DataType.ARRAY, false);
        this.registerAttribute(9, 'activate_passive_calendar_time', DataType_1.DataType.DATE_TIME, true);
        // Register class methods
        this.registerMethod(1, 'activate_passive_calendar');
    }
    /**
     * Get calendar name
     */
    getCalendarName() {
        return this.calendarName;
    }
    /**
     * Set calendar name
     */
    setCalendarName(name) {
        this.calendarName = name;
    }
    /**
     * Get active plan
     */
    getActivePlan() {
        return this.cloneCalendarPlan(this.activePlan);
    }
    /**
     * Get passive plan
     */
    getPassivePlan() {
        return this.cloneCalendarPlan(this.passivePlan);
    }
    /**
     * Set passive plan
     */
    setPassivePlan(plan) {
        this.validateCalendarPlan(plan);
        this.passivePlan = this.cloneCalendarPlan(plan);
    }
    /**
     * Get activate passive time
     */
    getActivatePassiveTime() {
        return this.activatePassiveTime ? new Date(this.activatePassiveTime) : undefined;
    }
    /**
     * Set activate passive time
     */
    setActivatePassiveTime(time) {
        this.activatePassiveTime = new Date(time);
    }
    /**
     * Activate passive calendar
     */
    activatePassiveCalendar() {
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
    getCurrentSeason() {
        const now = new Date();
        let currentSeason;
        let latestStart;
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
    getCurrentDayProfile() {
        const currentSeason = this.getCurrentSeason();
        if (!currentSeason)
            return undefined;
        const currentWeek = this.activePlan.weekProfiles.find(w => w.weekName === currentSeason.weekName);
        if (!currentWeek)
            return undefined;
        const dayName = this.getDayProfileName(currentWeek);
        return this.activePlan.dayProfiles.find(d => d.dayId === dayName);
    }
    /**
     * Get current actions
     */
    getCurrentActions() {
        const currentDayProfile = this.getCurrentDayProfile();
        if (!currentDayProfile)
            return [];
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
    cloneCalendarPlan(plan) {
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
    validateCalendarPlan(plan) {
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
    getDayProfileName(weekProfile) {
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
    handleGet(attributeId) {
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
    handleSet(attributeId, value) {
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
    handleAction(methodId) {
        switch (methodId) {
            case 1: // activate_passive_calendar
                this.activatePassiveCalendar();
                break;
            default:
                throw new Error(`Invalid method id ${methodId} for ActivityCalendar class`);
        }
    }
}
exports.ActivityCalendar = ActivityCalendar;
