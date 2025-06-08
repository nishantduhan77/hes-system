"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSchedule = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const ObisCode_1 = require("../obis/ObisCode");
const Types_1 = require("../data/Types");
/**
 * Push Schedule Class
 * Implements scheduling for instant push data transmission
 * OBIS Code: 0.0.15.0.4.255
 */
class PushSchedule extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor() {
        super(ObisCode_1.ObisCode.fromString('0.0.15.0.4.255'), 1);
        this.currentSchedule = [];
        this.scheduleType = 'FIFTEEN_MIN';
        this.isEnabled = true;
        this.initializeAttributes();
        this.setScheduleType('FIFTEEN_MIN'); // Default to 15-minute schedule
    }
    initializeAttributes() {
        // Attribute 1: Logical Name (inherited)
        // Attribute 2: Schedule Entries
        this.addAttribute(2, {
            name: 'schedule_entries',
            type: 'array',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.getScheduleEntries(),
            setValue: (value) => { this.setScheduleEntries(value); }
        });
        // Attribute 3: Schedule Type
        this.addAttribute(3, {
            name: 'schedule_type',
            type: 'enum',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.scheduleType,
            setValue: (value) => {
                this.setScheduleType(value);
            }
        });
        // Attribute 4: Schedule Status
        this.addAttribute(4, {
            name: 'schedule_status',
            type: 'boolean',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.isEnabled,
            setValue: (value) => { this.isEnabled = value; }
        });
    }
    /**
     * Set schedule type and update entries
     */
    setScheduleType(type) {
        this.scheduleType = type;
        this.currentSchedule = [...PushSchedule.SCHEDULES[type]];
    }
    /**
     * Get current schedule entries
     */
    getScheduleEntries() {
        return this.currentSchedule.map(entry => ({
            date: entry.date,
            time: entry.time,
            comment: entry.comment
        }));
    }
    /**
     * Set schedule entries
     */
    setScheduleEntries(entries) {
        this.currentSchedule = entries.map(entry => ({
            date: entry.date,
            time: entry.time,
            comment: entry.comment
        }));
    }
    /**
     * Check if current time matches any schedule entry
     */
    isScheduledTime(currentTime) {
        if (!this.isEnabled) {
            return false;
        }
        const timeStr = this.formatTime(currentTime);
        return this.currentSchedule.some(entry => this.matchesSchedule(entry, timeStr));
    }
    /**
     * Format time to HH:MM:SS format
     */
    formatTime(date) {
        return date.toTimeString().split(' ')[0];
    }
    /**
     * Check if given time matches schedule entry
     */
    matchesSchedule(entry, timeStr) {
        const [scheduleHour, scheduleMinute] = entry.time.split(':');
        const [currentHour, currentMinute] = timeStr.split(':');
        // Handle wildcard (FF) matching
        const hourMatch = scheduleHour === 'FF' || scheduleHour === currentHour;
        const minuteMatch = scheduleMinute === 'FF' || scheduleMinute === currentMinute;
        return hourMatch && minuteMatch;
    }
    /**
     * Disable schedule (set null array)
     */
    disableSchedule() {
        this.isEnabled = false;
        this.currentSchedule = [];
    }
    /**
     * Get next scheduled time
     */
    getNextScheduledTime(currentTime) {
        if (!this.isEnabled || this.currentSchedule.length === 0) {
            return null;
        }
        const now = currentTime.getTime();
        const nextTimes = this.currentSchedule.map(entry => {
            return this.calculateNextOccurrence(entry, currentTime);
        });
        // Get the closest future time
        const futureSchedules = nextTimes.filter(time => time.getTime() > now);
        return futureSchedules.length > 0 ?
            new Date(Math.min(...futureSchedules.map(d => d.getTime()))) :
            null;
    }
    /**
     * Calculate next occurrence of a schedule entry
     */
    calculateNextOccurrence(entry, currentTime) {
        const next = new Date(currentTime);
        const [hour, minute] = entry.time.split(':').map(x => x === 'FF' ? -1 : parseInt(x, 16));
        if (hour !== -1) {
            next.setHours(hour);
        }
        if (minute !== -1) {
            next.setMinutes(minute);
        }
        next.setSeconds(0);
        next.setMilliseconds(0);
        // If the calculated time is in the past, add the appropriate interval
        if (next.getTime() <= currentTime.getTime()) {
            switch (this.scheduleType) {
                case 'FIFTEEN_MIN':
                    next.setMinutes(next.getMinutes() + 15);
                    break;
                case 'THIRTY_MIN':
                    next.setMinutes(next.getMinutes() + 30);
                    break;
                case 'ONE_HOUR':
                    next.setHours(next.getHours() + 1);
                    break;
                case 'FOUR_HOUR':
                    next.setHours(next.getHours() + 4);
                    break;
                case 'EIGHT_HOUR':
                    next.setHours(next.getHours() + 8);
                    break;
                case 'TWELVE_HOUR':
                    next.setHours(next.getHours() + 12);
                    break;
                case 'TWENTY_FOUR_HOUR':
                    next.setDate(next.getDate() + 1);
                    break;
            }
        }
        return next;
    }
    toString() {
        return `PushSchedule [Type: ${this.scheduleType}, Enabled: ${this.isEnabled}, Entries: ${this.currentSchedule.length}]`;
    }
}
exports.PushSchedule = PushSchedule;
// Schedule configurations for different intervals
PushSchedule.SCHEDULES = {
    FIFTEEN_MIN: [
        { date: 'FF:FF:FF:FF:FF', time: 'FF:00:00:FF', comment: 'Time Programmed for 00 Min of every Hour' },
        { date: 'FF:FF:FF:FF:FF', time: 'FF:0F:00:FF', comment: 'Time Programmed for 15th min of every Hour' },
        { date: 'FF:FF:FF:FF:FF', time: 'FF:1E:00:FF', comment: 'Time Programmed for 30th min of every Hour' },
        { date: 'FF:FF:FF:FF:FF', time: 'FF:2D:00:FF', comment: 'Time Programmed for 45th min of every Hour' }
    ],
    THIRTY_MIN: [
        { date: 'FF:FF:FF:FF:FF', time: 'FF:00:00:FF', comment: 'Time Programmed for 00 min of every Hours' },
        { date: 'FF:FF:FF:FF:FF', time: 'FF:1E:00:FF', comment: 'Time Programmed for 30th min of every Hour' }
    ],
    ONE_HOUR: [
        { date: 'FF:FF:FF:FF:FF', time: 'FF:00:00:FF', comment: 'Time Programmed for 00min of every hour of the day' }
    ],
    FOUR_HOUR: [
        { date: 'FF:FF:FF:FF:FF', time: '00:00:00:FF', comment: 'Time Programmed for 00th Hour 00 min of every day' },
        { date: 'FF:FF:FF:FF:FF', time: '04:00:00:FF', comment: 'Time Programmed for 04th Hour 00 min of every day' },
        { date: 'FF:FF:FF:FF:FF', time: '08:00:00:FF', comment: 'Time Programmed for 08th Hour 00 min of every day' },
        { date: 'FF:FF:FF:FF:FF', time: '0C:00:00:FF', comment: 'Time Programmed for 12th Hour 00 min of every day' },
        { date: 'FF:FF:FF:FF:FF', time: '10:00:00:FF', comment: 'Time Programmed for 16th Hour 00 min of every day' },
        { date: 'FF:FF:FF:FF:FF', time: '14:00:00:FF', comment: 'Time Programmed for 20th Hour 00 min of every day' }
    ],
    EIGHT_HOUR: [
        { date: 'FF:FF:FF:FF:FF', time: '00:00:00:FF', comment: 'Time Programmed for 00th Hour 00 min of every day' },
        { date: 'FF:FF:FF:FF:FF', time: '08:00:00:FF', comment: 'Time Programmed for 08th Hour 00 min of every day' },
        { date: 'FF:FF:FF:FF:FF', time: '10:00:00:FF', comment: 'Time Programmed for 16th Hour 00 min of every day' }
    ],
    TWELVE_HOUR: [
        { date: 'FF:FF:FF:FF:FF', time: '00:00:00:FF', comment: 'Time Programmed for 00th Hour 00 min of every day' },
        { date: 'FF:FF:FF:FF:FF', time: '0C:00:00:FF', comment: 'Time Programmed for 12th Hour 00 min of every day' }
    ],
    TWENTY_FOUR_HOUR: [
        { date: 'FF:FF:FF:FF:FF', time: '00:00:00:FF', comment: 'Time Programmed for 00th Hour 00 min of every day' }
    ]
};
