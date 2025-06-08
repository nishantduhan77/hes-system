"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerQualityEventGenerator = void 0;
class PowerQualityEventGenerator {
    constructor(config) {
        this.config = {
            sagProbability: config.sagProbability || 0.2,
            swellProbability: config.swellProbability || 0.1,
            interruptProbability: config.interruptProbability || 0.05,
            harmonicsProbability: config.harmonicsProbability || 0.15,
            flickerProbability: config.flickerProbability || 0.1,
            limits: config.limits || PowerQualityEventGenerator.DEFAULT_LIMITS
        };
        this.lastGenerationDate = new Date();
        this.validateConfig();
    }
    /**
     * Validate configuration
     */
    validateConfig() {
        // Validate probabilities
        const probabilities = [
            'sagProbability',
            'swellProbability',
            'interruptProbability',
            'harmonicsProbability',
            'flickerProbability'
        ];
        for (const prop of probabilities) {
            const value = this.config[prop];
            if (value < 0 || value > 1) {
                throw new Error(`${prop} must be between 0 and 1`);
            }
        }
        // Validate limits
        this.validateLimits();
    }
    /**
     * Validate limits configuration
     */
    validateLimits() {
        const validations = [
            { name: 'sagDuration', min: 50, max: 10000 },
            { name: 'swellDuration', min: 50, max: 5000 },
            { name: 'interruptDuration', min: 100, max: 600000 },
            { name: 'harmonicsDuration', min: 60000, max: 7200000 },
            { name: 'flickerDuration', min: 30000, max: 1800000 },
            { name: 'sagMagnitude', min: 10, max: 90 },
            { name: 'swellMagnitude', min: 110, max: 180 },
            { name: 'harmonicsMagnitude', min: 1, max: 20 },
            { name: 'flickerMagnitude', min: 1, max: 10 }
        ];
        const limits = this.config.limits;
        for (const validation of validations) {
            const limit = limits[validation.name];
            if (!limit || limit.min < validation.min || limit.max > validation.max) {
                throw new Error(`${validation.name} limits out of range`);
            }
            if (limit.min > limit.max) {
                throw new Error(`${validation.name} minimum cannot be greater than maximum`);
            }
        }
    }
    /**
     * Ensure value is within limits
     */
    enforceLimit(value, type) {
        const limit = this.config.limits[type];
        return Math.min(Math.max(value, limit.min), limit.max);
    }
    /**
     * Generate power quality events for the next 24 hours
     */
    generateEvents(startTime) {
        const events = [];
        const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
        // Check if we need to generate new events
        if (startTime.getDate() === this.lastGenerationDate.getDate()) {
            return events;
        }
        // Generate voltage sags
        if (Math.random() < this.config.sagProbability) {
            events.push(...this.generateSagEvents(startTime, endTime));
        }
        // Generate voltage swells
        if (Math.random() < this.config.swellProbability) {
            events.push(...this.generateSwellEvents(startTime, endTime));
        }
        // Generate interruptions
        if (Math.random() < this.config.interruptProbability) {
            events.push(...this.generateInterruptionEvents(startTime, endTime));
        }
        // Generate harmonics
        if (Math.random() < this.config.harmonicsProbability) {
            events.push(...this.generateHarmonicsEvents(startTime, endTime));
        }
        // Generate flicker
        if (Math.random() < this.config.flickerProbability) {
            events.push(...this.generateFlickerEvents(startTime, endTime));
        }
        this.lastGenerationDate = new Date(startTime);
        return events;
    }
    /**
     * Generate voltage sag events
     */
    generateSagEvents(startTime, endTime) {
        const events = [];
        const count = this.getRandomInt(1, 3);
        for (let i = 0; i < count; i++) {
            const eventTime = this.getRandomTime(startTime, endTime);
            events.push({
                type: 'sag',
                startTime: eventTime,
                duration: this.enforceLimit(this.getRandomInt(100, 5000), 'sagDuration'),
                magnitude: this.enforceLimit(this.getRandomInt(50, 90), 'sagMagnitude'),
                phase: this.getRandomInt(1, 3)
            });
        }
        return events;
    }
    /**
     * Generate voltage swell events
     */
    generateSwellEvents(startTime, endTime) {
        const events = [];
        const count = this.getRandomInt(1, 2);
        for (let i = 0; i < count; i++) {
            const eventTime = this.getRandomTime(startTime, endTime);
            events.push({
                type: 'swell',
                startTime: eventTime,
                duration: this.enforceLimit(this.getRandomInt(100, 3000), 'swellDuration'),
                magnitude: this.enforceLimit(this.getRandomInt(110, 140), 'swellMagnitude'),
                phase: this.getRandomInt(1, 3)
            });
        }
        return events;
    }
    /**
     * Generate power interruption events
     */
    generateInterruptionEvents(startTime, endTime) {
        const events = [];
        const count = this.getRandomInt(0, 1); // 0-1 interruptions per day
        for (let i = 0; i < count; i++) {
            const eventTime = this.getRandomTime(startTime, endTime);
            events.push({
                type: 'interruption',
                startTime: eventTime,
                duration: this.getRandomInt(1000, 300000), // 1s to 5min
                magnitude: 0, // Complete interruption
                phase: 0 // All phases
            });
        }
        return events;
    }
    /**
     * Generate harmonic distortion events
     */
    generateHarmonicsEvents(startTime, endTime) {
        const events = [];
        const count = this.getRandomInt(1, 2); // 1-2 harmonic events per day
        for (let i = 0; i < count; i++) {
            const eventTime = this.getRandomTime(startTime, endTime);
            events.push({
                type: 'harmonics',
                startTime: eventTime,
                duration: this.getRandomInt(300000, 3600000), // 5min to 1hour
                magnitude: this.getRandomInt(3, 8), // 3-8% THD
                frequency: this.getRandomChoice([3, 5, 7]) // Common harmonics
            });
        }
        return events;
    }
    /**
     * Generate voltage flicker events
     */
    generateFlickerEvents(startTime, endTime) {
        const events = [];
        const count = this.getRandomInt(1, 3); // 1-3 flicker events per day
        for (let i = 0; i < count; i++) {
            const eventTime = this.getRandomTime(startTime, endTime);
            events.push({
                type: 'flicker',
                startTime: eventTime,
                duration: this.getRandomInt(60000, 900000), // 1min to 15min
                magnitude: this.getRandomInt(2, 5), // 2-5% variation
                frequency: 8.8 // Common flicker frequency
            });
        }
        return events;
    }
    /**
     * Get random integer between min and max (inclusive)
     */
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * Get random time between start and end
     */
    getRandomTime(start, end) {
        const startTime = start.getTime();
        const endTime = end.getTime();
        const randomTime = startTime + Math.random() * (endTime - startTime);
        return new Date(randomTime);
    }
    /**
     * Get random choice from array
     */
    getRandomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}
exports.PowerQualityEventGenerator = PowerQualityEventGenerator;
PowerQualityEventGenerator.DEFAULT_LIMITS = {
    sagDuration: { min: 100, max: 5000 }, // 100ms to 5s
    swellDuration: { min: 100, max: 3000 }, // 100ms to 3s
    interruptDuration: { min: 1000, max: 300000 }, // 1s to 5min
    harmonicsDuration: { min: 300000, max: 3600000 }, // 5min to 1h
    flickerDuration: { min: 60000, max: 900000 }, // 1min to 15min
    sagMagnitude: { min: 50, max: 90 }, // 50-90% of nominal
    swellMagnitude: { min: 110, max: 140 }, // 110-140% of nominal
    harmonicsMagnitude: { min: 3, max: 8 }, // 3-8% THD
    flickerMagnitude: { min: 2, max: 5 } // 2-5% variation
};
