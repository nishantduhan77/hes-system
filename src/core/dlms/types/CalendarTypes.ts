/**
 * Season Profile
 */
export interface SeasonProfile {
    seasonName: string;
    startDate: Date;
    weekName: string;
}

/**
 * Weekly Profile
 */
export interface WeekProfile {
    weekName: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
}

/**
 * Day Profile Action
 */
export interface DayProfileAction {
    startTime: Date;
    scriptLogicalName: number[];
    scriptSelector: number;
}

/**
 * Day Profile
 */
export interface DayProfile {
    dayId: string;
    actions: DayProfileAction[];
}

/**
 * Calendar Plan
 */
export interface CalendarPlan {
    name: string;
    seasonProfiles: SeasonProfile[];
    weekProfiles: WeekProfile[];
    dayProfiles: DayProfile[];
    activateTime?: Date;
} 