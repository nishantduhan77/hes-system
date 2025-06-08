import { PushSetup } from '../cosem/objects/PushSetup';
import { PushSchedule } from '../cosem/objects/PushSchedule';

/**
 * Push Service Class
 * Integrates push scheduling with push data transmission
 */
export class PushService {
    private pushSetup: PushSetup;
    private pushSchedule: PushSchedule;
    private schedulerInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.pushSetup = new PushSetup();
        this.pushSchedule = new PushSchedule();
    }

    /**
     * Start push service with specified schedule type
     */
    public start(scheduleType: keyof typeof PushSchedule['SCHEDULES']): void {
        this.pushSchedule.setScheduleType(scheduleType);
        this.startScheduler();
    }

    /**
     * Stop push service
     */
    public stop(): void {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        this.pushSchedule.disableSchedule();
    }

    /**
     * Start the scheduler
     */
    private startScheduler(): void {
        // Clear any existing scheduler
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
        }

        // Check every minute for scheduled pushes
        this.schedulerInterval = setInterval(() => {
            const now = new Date();
            if (this.pushSchedule.isScheduledTime(now)) {
                this.executePush();
            }
        }, 60000); // Check every minute

        // Execute immediately if it's currently a scheduled time
        if (this.pushSchedule.isScheduledTime(new Date())) {
            this.executePush();
        }
    }

    /**
     * Execute push operation
     */
    private async executePush(): Promise<void> {
        try {
            const success = await this.pushSetup.pushData();
            if (!success) {
                console.error('Push operation failed');
            }
        } catch (error) {
            console.error('Error executing push:', error);
        }
    }

    /**
     * Get next scheduled push time
     */
    public getNextPushTime(): Date | null {
        return this.pushSchedule.getNextScheduledTime(new Date());
    }

    /**
     * Configure push destination
     */
    public configurePushDestination(destination: string): void {
        this.pushSetup.setAttribute(3, destination);
    }

    /**
     * Configure retry parameters
     */
    public configureRetryParameters(retries: number, retryDelay: number): void {
        this.pushSetup.setAttribute(6, retries);
        this.pushSetup.setAttribute(7, retryDelay);
    }
} 