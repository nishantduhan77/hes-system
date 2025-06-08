"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStatusWordFlag = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const ObisCode_1 = require("../obis/ObisCode");
const Types_1 = require("../data/Types");
/**
 * Event Status Word Flag (ESWF) Class
 * Used for push alarms configuration
 *
 * Notes:
 * 1. Each bit position represents a specific event
 * 2. Events are grouped into 16-bit words (ESW_BYTE_15 to ESW_BYTE_0)
 * 3. Total 128 events can be configured (8 groups of 16 bits each)
 */
class EventStatusWordFlag extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor() {
        super(ObisCode_1.ObisCode.fromString('0.0.96.11.0.255'), 1);
        // Event Status Word bytes
        this.eswBytes = new Map();
        this.initializeESWBytes();
        this.initializeAttributes();
    }
    initializeESWBytes() {
        // Initialize all ESW bytes to 0
        for (let i = 0; i <= 15; i++) {
            this.eswBytes.set(i, 0);
        }
    }
    initializeAttributes() {
        // Add attribute for each ESW byte
        for (let i = 0; i <= 15; i++) {
            this.addAttribute(i + 2, {
                name: `esw_byte_${i}`,
                type: 'unsigned',
                access: Types_1.AccessLevel.READ_WRITE,
                getValue: () => this.eswBytes.get(i) || 0,
                setValue: (value) => {
                    this.eswBytes.set(i, value & 0xFFFF); // Ensure 16-bit value
                }
            });
        }
    }
    /**
     * Set event status
     */
    setEventStatus(eventName, status) {
        const eventConfig = EventStatusWordFlag.ESW_BITS[eventName];
        if (!eventConfig) {
            throw new Error(`Unknown event: ${eventName}`);
        }
        const currentValue = this.eswBytes.get(eventConfig.byte) || 0;
        if (status) {
            // Set bit
            this.eswBytes.set(eventConfig.byte, currentValue | (1 << eventConfig.bit));
        }
        else {
            // Clear bit
            this.eswBytes.set(eventConfig.byte, currentValue & ~(1 << eventConfig.bit));
        }
    }
    /**
     * Get event status
     */
    getEventStatus(eventName) {
        const eventConfig = EventStatusWordFlag.ESW_BITS[eventName];
        if (!eventConfig) {
            throw new Error(`Unknown event: ${eventName}`);
        }
        const value = this.eswBytes.get(eventConfig.byte) || 0;
        return (value & (1 << eventConfig.bit)) !== 0;
    }
    /**
     * Get all active events
     */
    getActiveEvents() {
        const activeEvents = [];
        for (const [eventName, config] of Object.entries(EventStatusWordFlag.ESW_BITS)) {
            const value = this.eswBytes.get(config.byte) || 0;
            if (value & (1 << config.bit)) {
                activeEvents.push(eventName);
            }
        }
        return activeEvents;
    }
    /**
     * Clear all events
     */
    clearAllEvents() {
        this.initializeESWBytes();
    }
    /**
     * Get ESW byte value
     */
    getESWByte(byteNumber) {
        if (byteNumber < 0 || byteNumber > 15) {
            throw new Error('Invalid ESW byte number. Must be between 0 and 15.');
        }
        return this.eswBytes.get(byteNumber) || 0;
    }
    /**
     * Set ESW byte value
     */
    setESWByte(byteNumber, value) {
        if (byteNumber < 0 || byteNumber > 15) {
            throw new Error('Invalid ESW byte number. Must be between 0 and 15.');
        }
        this.eswBytes.set(byteNumber, value & 0xFFFF); // Ensure 16-bit value
    }
    /**
     * Convert object to string representation
     */
    toString() {
        const activeEvents = this.getActiveEvents();
        return `EventStatusWordFlag [Active Events: ${activeEvents.join(', ')}]`;
    }
}
exports.EventStatusWordFlag = EventStatusWordFlag;
// Constants for bit positions
EventStatusWordFlag.ESW_BITS = {
    // ESW_BYTE_15 (Voltage related events)
    R_PHASE_VOLTAGE_MISSING: { byte: 15, bit: 0 },
    Y_PHASE_VOLTAGE_MISSING: { byte: 15, bit: 1 },
    B_PHASE_VOLTAGE_MISSING: { byte: 15, bit: 2 },
    LOW_VOLTAGE: { byte: 15, bit: 3 },
    VOLTAGE_UNBALANCE: { byte: 15, bit: 4 },
    VOLTAGE_HIGH: { byte: 15, bit: 5 },
    VOLTAGE_LOW: { byte: 15, bit: 6 },
    VOLTAGE_SWELL: { byte: 15, bit: 7 },
    VOLTAGE_SAG_DIP: { byte: 15, bit: 8 },
    CURRENT_UNBALANCE: { byte: 15, bit: 9 },
    OVER_CURRENT: { byte: 15, bit: 10 },
    OVER_VOLTAGE: { byte: 15, bit: 11 },
    LOW_VOLTAGE_2: { byte: 15, bit: 12 },
    // bits 13-15 reserved
    // ESW_BYTE_14 (Current related events)
    R_PHASE_CURRENT_MISSING: { byte: 14, bit: 0 },
    Y_PHASE_CURRENT_MISSING: { byte: 14, bit: 1 },
    B_PHASE_CURRENT_MISSING: { byte: 14, bit: 2 },
    CURRENT_REVERSAL: { byte: 14, bit: 3 },
    CT_OPEN: { byte: 14, bit: 4 },
    CT_REVERSAL: { byte: 14, bit: 5 },
    CT_SHORT: { byte: 14, bit: 6 },
    CURRENT_BYPASS: { byte: 14, bit: 7 },
    OVER_CURRENT_IN_PHASE: { byte: 14, bit: 8 },
    OVER_LOAD: { byte: 14, bit: 9 },
    // bits 10-15 reserved
    // ESW_BYTE_13 (Power related events)
    POWER_FAILURE: { byte: 13, bit: 0 },
    // bits 1-15 reserved
    // ESW_BYTE_12 (Transaction events)
    REAL_TIME_CLOCK: { byte: 12, bit: 0 },
    DEMAND_INTEGRATION_PERIOD: { byte: 12, bit: 1 },
    PROFILE_CAPTURE_PERIOD: { byte: 12, bit: 2 },
    SINGLE_ACTION_SCHEDULE: { byte: 12, bit: 3 },
    BILLING_DATE: { byte: 12, bit: 4 },
    ACTIVITY_CALENDAR: { byte: 12, bit: 5 },
    // bits 6-15 reserved
    // ESW_BYTE_11 (Other events)
    PERMANENT_MAGNET: { byte: 11, bit: 0 },
    NEUTRAL_DISTURBANCE: { byte: 11, bit: 1 },
    METER_COVER_OPEN: { byte: 11, bit: 2 },
    // bits 3-15 reserved
    // ESW_BYTE_10 (Communication events)
    PUSH_SETUP_1: { byte: 10, bit: 0 },
    PUSH_SETUP_2: { byte: 10, bit: 1 },
    PUSH_SETUP_3: { byte: 10, bit: 2 },
    PUSH_SETUP_4: { byte: 10, bit: 3 },
    // bits 4-15 reserved
    // ESW_BYTE_9 (Temperature and association events)
    WRONG_PHASE_ASSOCIATION: { byte: 9, bit: 0 },
    TEMPERATURE_RISE: { byte: 9, bit: 1 },
    MD: { byte: 9, bit: 2 },
    // bits 3-15 reserved
    // ESW_BYTE_8 (Additional events)
    PHASE_SEQUENCE_REVERSAL: { byte: 8, bit: 0 },
    R_PHASE_CT_OPEN: { byte: 8, bit: 1 },
    Y_PHASE_CT_OPEN: { byte: 8, bit: 2 },
    B_PHASE_CT_OPEN: { byte: 8, bit: 3 },
    HIGH_NEUTRAL_CURRENT: { byte: 8, bit: 4 },
    // bits 5-15 reserved
};
