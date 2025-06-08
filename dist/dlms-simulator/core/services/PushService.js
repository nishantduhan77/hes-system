"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const PushSetup_1 = require("../cosem/objects/PushSetup");
const PushSchedule_1 = require("../cosem/objects/PushSchedule");
/**
 * Push Service Class
 * Integrates push scheduling with push data transmission
 */
class PushService {
    constructor() {
        this.schedulerInterval = null;
        this.pushSetup = new PushSetup_1.PushSetup();
        this.pushSchedule = new PushSchedule_1.PushSchedule();
    }
    /**
     * Start push service with specified schedule type
     */
    start(scheduleType) {
        this.pushSchedule.setScheduleType(scheduleType);
        this.startScheduler();
    }
    /**
     * Stop push service
     */
    stop() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        this.pushSchedule.disableSchedule();
    }
    /**
     * Start the scheduler
     */
    startScheduler() {
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
    async executePush() {
        try {
            const success = await this.pushSetup.pushData();
            if (!success) {
                console.error('Push operation failed');
            }
        }
        catch (error) {
            console.error('Error executing push:', error);
        }
    }
    /**
     * Get next scheduled push time
     */
    getNextPushTime() {
        return this.pushSchedule.getNextScheduledTime(new Date());
    }
    /**
     * Configure push destination
     */
    configurePushDestination(destination) {
        this.pushSetup.setAttribute(3, destination);
    }
    /**
     * Configure retry parameters
     */
    configureRetryParameters(retries, retryDelay) {
        this.pushSetup.setAttribute(6, retries);
        this.pushSetup.setAttribute(7, retryDelay);
    }
}
exports.PushService = PushService;
