"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDIAN_EVENT_CODES = void 0;
const axios_1 = __importDefault(require("axios"));
// Indian Event Codes as per IS 15959
exports.INDIAN_EVENT_CODES = {
    POWER_FAILURE: {
        code: '0x00010000',
        description: 'Power failure event',
        severity: 'HIGH'
    },
    POWER_RESTORATION: {
        code: '0x00010001',
        description: 'Power restoration event',
        severity: 'MEDIUM'
    },
    VOLTAGE_HIGH: {
        code: '0x00020000',
        description: 'Voltage high event',
        severity: 'HIGH'
    },
    VOLTAGE_LOW: {
        code: '0x00020001',
        description: 'Voltage low event',
        severity: 'HIGH'
    },
    CURRENT_HIGH: {
        code: '0x00030000',
        description: 'Current high event',
        severity: 'HIGH'
    },
    MAGNETIC_TAMPER: {
        code: '0x00040000',
        description: 'Magnetic tamper detected',
        severity: 'HIGH'
    },
    COVER_OPEN: {
        code: '0x00040001',
        description: 'Meter cover opened',
        severity: 'HIGH'
    },
    NEUTRAL_DISTURBANCE: {
        code: '0x00040002',
        description: 'Neutral disturbance detected',
        severity: 'HIGH'
    }
};
class MeterEventService {
    constructor() {
        this.subscribers = [];
    }
    static getInstance() {
        if (!MeterEventService.instance) {
            MeterEventService.instance = new MeterEventService();
        }
        return MeterEventService.instance;
    }
    subscribeToEvents(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }
    async publishEvent(event) {
        this.subscribers.forEach(callback => callback(event));
    }
    // Create a new event
    async createEvent(event) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/events`, {
                ...event,
                timestamp: new Date().toISOString(),
                acknowledged: false
            });
            const newEvent = response.data;
            this.publishEvent(newEvent);
            return newEvent;
        }
        catch (error) {
            console.error('Failed to create event:', error);
            throw error;
        }
    }
    // Get events for a specific meter
    async getMeterEvents(meterId, startDate, endDate) {
        try {
            const params = {
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString()
            };
            const response = await axios_1.default.get(`${this.baseUrl}/meters/${meterId}/events`, { params });
            return response.data;
        }
        catch (error) {
            console.error('Failed to fetch meter events:', error);
            throw error;
        }
    }
    // Acknowledge an event
    async acknowledgeEvent(eventId) {
        try {
            await axios_1.default.put(`${this.baseUrl}/events/${eventId}/acknowledge`);
        }
        catch (error) {
            console.error('Failed to acknowledge event:', error);
            throw error;
        }
    }
    // Monitor power restoration events
    async monitorPowerRestoration(meterId) {
        try {
            // First check if there's an unacknowledged power failure event
            const events = await this.getMeterEvents(meterId);
            const lastPowerFailure = events.find(e => e.eventCode === exports.INDIAN_EVENT_CODES.POWER_FAILURE.code && !e.acknowledged);
            if (lastPowerFailure) {
                // Create power restoration event
                await this.createEvent({
                    meterId,
                    eventType: 'POWER_RESTORATION',
                    eventCode: exports.INDIAN_EVENT_CODES.POWER_RESTORATION.code,
                    description: exports.INDIAN_EVENT_CODES.POWER_RESTORATION.description,
                    severity: exports.INDIAN_EVENT_CODES.POWER_RESTORATION.severity,
                    parameters: {
                        failureTimestamp: lastPowerFailure.timestamp,
                        downtime: (new Date().getTime() - new Date(lastPowerFailure.timestamp).getTime()) / 1000 // in seconds
                    }
                });
                // Acknowledge the power failure event
                await this.acknowledgeEvent(lastPowerFailure.meterId);
            }
        }
        catch (error) {
            console.error('Failed to monitor power restoration:', error);
            throw error;
        }
    }
}
exports.default = MeterEventService;
