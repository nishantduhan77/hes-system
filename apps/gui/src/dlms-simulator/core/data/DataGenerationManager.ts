import { EventEmitter } from 'events';
import { SimulatorLogger, LogLevel } from '../monitoring/SimulatorLogger';

export interface LoadProfileTemplate {
    id: string;
    name: string;
    interval: number; // in minutes
    patterns: {
        activePower: number[];    // in watts
        reactivePower: number[];  // in VAR
        current: number[];        // in amperes
        voltage: number[];        // in volts
        powerFactor: number[];    // 0 to 1
    };
    seasonalFactors: {
        [season: string]: number; // multiplier for each season
    };
    dailyFactors: {
        [day: string]: number;    // multiplier for each day (Mon-Sun)
    };
}

export interface PowerQualityEvent {
    type: 'sag' | 'swell' | 'interruption' | 'harmonics' | 'flicker';
    startTime: Date;
    duration: number;  // in milliseconds
    magnitude: number; // percentage of nominal value
    phase?: number;    // affected phase(s)
    frequency?: number;// for harmonics
}

export interface DataGenerationConfig {
    baseLoadProfile: LoadProfileTemplate;
    seasonalPatterns: boolean;
    dailyPatterns: boolean;
    powerQualityEvents: boolean;
    randomVariation: number; // percentage of random variation
    updateInterval: number;  // in milliseconds
    limits: {
        voltage: { min: number; max: number; };     // Voltage limits in V
        current: { min: number; max: number; };     // Current limits in A
        powerFactor: { min: number; max: number; }; // Power factor limits
        activePower: { min: number; max: number; }; // Active power limits in W
        reactivePower: { min: number; max: number; };// Reactive power limits in VAR
    };
}

/**
 * Data Generation Manager Class
 * Handles generation of load profiles and power quality events
 */
export class DataGenerationManager extends EventEmitter {
    private config: DataGenerationConfig;
    private templates: Map<string, LoadProfileTemplate>;
    private currentValues: Map<string, number>;
    private eventQueue: PowerQualityEvent[];
    private updateTimer?: NodeJS.Timeout;
    private currentTime: Date;
    private logger: SimulatorLogger;

    private static readonly DEFAULT_LIMITS = {
        voltage: { min: 207, max: 253 },      // ±10% of 230V
        current: { min: 0, max: 100 },        // Maximum 100A
        powerFactor: { min: 0.8, max: 1.0 },  // Typical range
        activePower: { min: 0, max: 25000 },  // Maximum 25kW
        reactivePower: { min: 0, max: 10000 } // Maximum 10kVAR
    };

    constructor(config: DataGenerationConfig) {
        super();
        this.config = {
            ...config,
            limits: config.limits || DataGenerationManager.DEFAULT_LIMITS
        };
        this.templates = new Map();
        this.currentValues = new Map();
        this.eventQueue = [];
        this.currentTime = new Date();
        this.logger = SimulatorLogger.getInstance();

        this.validateConfig();
        this.addTemplate(config.baseLoadProfile);
        this.logger.logSystem('DataGenerationManager', 'Initialized', { config });
    }

    /**
     * Validate configuration
     */
    private validateConfig(): void {
        if (this.config.randomVariation < 0 || this.config.randomVariation > 100) {
            throw new Error('Random variation must be between 0 and 100 percent');
        }

        if (this.config.updateInterval < 1000) {
            throw new Error('Update interval must be at least 1000 milliseconds');
        }

        this.validateLimits(this.config.limits);
    }

    /**
     * Validate limits configuration
     */
    private validateLimits(limits: DataGenerationConfig['limits']): void {
        const validations = [
            { name: 'voltage', min: 180, max: 280 },      // Absolute limits
            { name: 'current', min: 0, max: 1000 },       // Reasonable maximum
            { name: 'powerFactor', min: 0, max: 1 },      // Physical limits
            { name: 'activePower', min: 0, max: 100000 }, // 100kW max
            { name: 'reactivePower', min: 0, max: 50000 } // 50kVAR max
        ];

        for (const validation of validations) {
            const limit = limits[validation.name as keyof typeof limits];
            if (limit.min < validation.min || limit.max > validation.max) {
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
    private enforceLimit(value: number, type: keyof DataGenerationConfig['limits']): number {
        const limit = this.config.limits[type];
        return Math.min(Math.max(value, limit.min), limit.max);
    }

    /**
     * Add a load profile template
     */
    public addTemplate(template: LoadProfileTemplate): void {
        // Validate template
        if (template.interval <= 0 || template.interval > 60) {
            throw new Error('Template interval must be between 1 and 60 minutes');
        }

        const expectedPoints = Math.ceil(24 * 60 / template.interval);
        const patterns = template.patterns;
        
        for (const [key, values] of Object.entries(patterns)) {
            if (values.length !== expectedPoints) {
                throw new Error(`${key} pattern must have ${expectedPoints} points`);
            }
        }

        this.templates.set(template.id, template);
    }

    /**
     * Start data generation
     */
    public start(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        this.updateTimer = setInterval(() => {
            this.generateData();
        }, this.config.updateInterval);

        this.logger.logSystem('DataGenerationManager', 'Started', {
            updateInterval: this.config.updateInterval
        });
    }

    /**
     * Stop data generation
     */
    public stop(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = undefined;
            this.logger.logSystem('DataGenerationManager', 'Stopped');
        }
    }

    /**
     * Generate data based on templates and patterns
     */
    private generateData(): void {
        try {
            this.currentTime = new Date();
            const template = this.templates.get(this.config.baseLoadProfile.id);
            
            if (!template) {
                this.logger.logError('DataGeneration', 'Base load profile template not found');
                return;
            }

            // Get time-based indices
            const minuteOfDay = this.currentTime.getHours() * 60 + this.currentTime.getMinutes();
            const patternIndex = Math.floor(minuteOfDay / template.interval);
            const dayOfWeek = this.currentTime.getDay();
            const month = this.currentTime.getMonth();

            // Get base values from template
            const baseValues = {
                activePower: template.patterns.activePower[patternIndex] || 0,
                reactivePower: template.patterns.reactivePower[patternIndex] || 0,
                current: template.patterns.current[patternIndex] || 0,
                voltage: template.patterns.voltage[patternIndex] || 230, // default to 230V
                powerFactor: template.patterns.powerFactor[patternIndex] || 0.95
            };

            // Apply seasonal patterns
            if (this.config.seasonalPatterns) {
                const season = this.getSeason(month);
                const seasonalFactor = template.seasonalFactors[season] || 1;
                baseValues.activePower *= seasonalFactor;
                baseValues.reactivePower *= seasonalFactor;
                baseValues.current *= seasonalFactor;
            }

            // Apply daily patterns
            if (this.config.dailyPatterns) {
                const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                const dailyFactor = template.dailyFactors[days[dayOfWeek]] || 1;
                baseValues.activePower *= dailyFactor;
                baseValues.reactivePower *= dailyFactor;
                baseValues.current *= dailyFactor;
            }

            // Apply random variation
            if (this.config.randomVariation > 0) {
                const variation = this.config.randomVariation / 100;
                Object.keys(baseValues).forEach(key => {
                    const value = baseValues[key as keyof typeof baseValues];
                    const randomFactor = 1 + (Math.random() * 2 - 1) * variation;
                    baseValues[key as keyof typeof baseValues] = value * randomFactor;
                });
            }

            // Apply power quality events
            if (this.config.powerQualityEvents) {
                this.applyPowerQualityEvents(baseValues);
            }

            // Apply limits to base values
            baseValues.voltage = this.enforceLimit(baseValues.voltage, 'voltage');
            baseValues.current = this.enforceLimit(baseValues.current, 'current');
            baseValues.powerFactor = this.enforceLimit(baseValues.powerFactor, 'powerFactor');
            baseValues.activePower = this.enforceLimit(baseValues.activePower, 'activePower');
            baseValues.reactivePower = this.enforceLimit(baseValues.reactivePower, 'reactivePower');

            // Log generated values
            this.logger.logDataGeneration(baseValues);

            // Update current values
            Object.entries(baseValues).forEach(([key, value]) => {
                this.currentValues.set(key, value);
            });

            // Emit data update event
            this.emit('dataUpdate', {
                timestamp: this.currentTime,
                values: { ...baseValues }
            });
        } catch (error) {
            this.logger.logError('DataGeneration', error as Error);
            throw error;
        }
    }

    /**
     * Add a power quality event
     */
    public addPowerQualityEvent(event: PowerQualityEvent): void {
        this.eventQueue.push(event);
        this.eventQueue.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        this.logger.logPowerQualityEvent(event);
    }

    /**
     * Apply power quality events to values
     */
    private applyPowerQualityEvents(values: any): void {
        const currentTime = this.currentTime.getTime();
        
        // Process events
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue[0];
            const eventEnd = event.startTime.getTime() + event.duration;

            if (eventEnd < currentTime) {
                // Event has ended, remove it
                this.eventQueue.shift();
                this.logger.log(LogLevel.DEBUG, 'PowerQuality', 'Event ended', event);
                continue;
            }

            if (event.startTime.getTime() > currentTime) {
                // Event hasn't started yet
                break;
            }

            // Log event application
            this.logger.log(LogLevel.DEBUG, 'PowerQuality', 'Applying event effect', event);

            // Apply event effects
            switch (event.type) {
                case 'sag':
                    values.voltage *= event.magnitude / 100;
                    break;
                case 'swell':
                    values.voltage *= event.magnitude / 100;
                    break;
                case 'interruption':
                    values.voltage = 0;
                    values.current = 0;
                    values.activePower = 0;
                    values.reactivePower = 0;
                    break;
                case 'harmonics':
                    // Simulate harmonic distortion by reducing power factor
                    values.powerFactor *= 0.9;
                    break;
                case 'flicker':
                    // Simulate voltage fluctuation
                    values.voltage *= 1 + (Math.sin(currentTime * 0.001) * (event.magnitude / 100));
                    break;
            }
        }
    }

    /**
     * Get season based on month
     */
    private getSeason(month: number): string {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }

    /**
     * Get current values
     */
    public getCurrentValues(): Map<string, number> {
        return new Map(this.currentValues);
    }

    /**
     * Get available templates
     */
    public getTemplates(): Map<string, LoadProfileTemplate> {
        return new Map(this.templates);
    }
} 