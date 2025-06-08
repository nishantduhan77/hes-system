import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel } from '../data/Types';

interface ScheduleEntry {
    date: string;  // FF:FF:FF:FF:FF format
    time: string;  // HH:MM:SS:FF format
    comment: string;
}

/**
 * Push Schedule Class
 * Implements scheduling for instant push data transmission
 * OBIS Code: 0.0.15.0.4.255
 */
export class PushSchedule extends CosemInterfaceClass {
    // Schedule configurations for different intervals
    private static readonly SCHEDULES = {
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

    private currentSchedule: ScheduleEntry[] = [];
    private scheduleType: keyof typeof PushSchedule.SCHEDULES = 'FIFTEEN_MIN';
    private isEnabled: boolean = true;

    constructor() {
        super(ObisCode.fromString('0.0.15.0.4.255'), 1);
        this.initializeAttributes();
        this.setScheduleType('FIFTEEN_MIN'); // Default to 15-minute schedule
    }

    private initializeAttributes(): void {
        // Attribute 1: Logical Name (inherited)

        // Attribute 2: Schedule Entries
        this.addAttribute(2, {
            name: 'schedule_entries',
            type: 'array',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.getScheduleEntries(),
            setValue: (value: any[]) => { this.setScheduleEntries(value); }
        });

        // Attribute 3: Schedule Type
        this.addAttribute(3, {
            name: 'schedule_type',
            type: 'enum',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.scheduleType,
            setValue: (value: keyof typeof PushSchedule.SCHEDULES) => {
                this.setScheduleType(value);
            }
        });

        // Attribute 4: Schedule Status
        this.addAttribute(4, {
            name: 'schedule_status',
            type: 'boolean',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.isEnabled,
            setValue: (value: boolean) => { this.isEnabled = value; }
        });
    }

    /**
     * Set schedule type and update entries
     */
    public setScheduleType(type: keyof typeof PushSchedule.SCHEDULES): void {
        this.scheduleType = type;
        this.currentSchedule = [...PushSchedule.SCHEDULES[type]];
    }

    /**
     * Get current schedule entries
     */
    private getScheduleEntries(): any[] {
        return this.currentSchedule.map(entry => ({
            date: entry.date,
            time: entry.time,
            comment: entry.comment
        }));
    }

    /**
     * Set schedule entries
     */
    private setScheduleEntries(entries: any[]): void {
        this.currentSchedule = entries.map(entry => ({
            date: entry.date,
            time: entry.time,
            comment: entry.comment
        }));
    }

    /**
     * Check if current time matches any schedule entry
     */
    public isScheduledTime(currentTime: Date): boolean {
        if (!this.isEnabled) {
            return false;
        }

        const timeStr = this.formatTime(currentTime);
        return this.currentSchedule.some(entry => this.matchesSchedule(entry, timeStr));
    }

    /**
     * Format time to HH:MM:SS format
     */
    private formatTime(date: Date): string {
        return date.toTimeString().split(' ')[0];
    }

    /**
     * Check if given time matches schedule entry
     */
    private matchesSchedule(entry: ScheduleEntry, timeStr: string): boolean {
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
    public disableSchedule(): void {
        this.isEnabled = false;
        this.currentSchedule = [];
    }

    /**
     * Get next scheduled time
     */
    public getNextScheduledTime(currentTime: Date): Date | null {
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
    private calculateNextOccurrence(entry: ScheduleEntry, currentTime: Date): Date {
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

    public toString(): string {
        return `PushSchedule [Type: ${this.scheduleType}, Enabled: ${this.isEnabled}, Entries: ${this.currentSchedule.length}]`;
    }
} 