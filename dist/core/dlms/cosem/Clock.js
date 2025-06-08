"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clock = exports.ClockStatus = void 0;
const CosemInterfaceClass_1 = require("../CosemInterfaceClass");
const DataType_1 = require("../types/DataType");
/**
 * Clock Status
 */
var ClockStatus;
(function (ClockStatus) {
    ClockStatus[ClockStatus["INVALID_VALUE"] = 1] = "INVALID_VALUE";
    ClockStatus[ClockStatus["DOUBTFUL_VALUE"] = 2] = "DOUBTFUL_VALUE";
    ClockStatus[ClockStatus["DIFFERENT_CLOCK_BASE"] = 4] = "DIFFERENT_CLOCK_BASE";
    ClockStatus[ClockStatus["INVALID_CLOCK_STATUS"] = 8] = "INVALID_CLOCK_STATUS";
    ClockStatus[ClockStatus["DAYLIGHT_SAVING_ACTIVE"] = 128] = "DAYLIGHT_SAVING_ACTIVE";
})(ClockStatus || (exports.ClockStatus = ClockStatus = {}));
/**
 * Clock Class (IC: 8)
 * This class is used for handling time-related functions
 */
class Clock extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, initialTime = new Date(), timeZone = 0, status = 0, daylightSavingsBegin = new Date(), daylightSavingsEnd = new Date(), daylightSavingsDeviation = 60, daylightSavingsEnabled = false, clockBase = 0) {
        super(8, logicalName);
        this.time = new Date(initialTime);
        this.timeZone = timeZone;
        this.status = status;
        this.daylightSavingsBegin = new Date(daylightSavingsBegin);
        this.daylightSavingsEnd = new Date(daylightSavingsEnd);
        this.daylightSavingsDeviation = daylightSavingsDeviation;
        this.daylightSavingsEnabled = daylightSavingsEnabled;
        this.clockBase = clockBase;
        // Register class attributes
        this.registerAttribute(1, 'logical_name', DataType_1.DataType.OCTET_STRING, false);
        this.registerAttribute(2, 'time', DataType_1.DataType.DATE_TIME, true);
        this.registerAttribute(3, 'time_zone', DataType_1.DataType.INT16, true);
        this.registerAttribute(4, 'status', DataType_1.DataType.UINT8, true);
        this.registerAttribute(5, 'daylight_savings_begin', DataType_1.DataType.DATE_TIME, true);
        this.registerAttribute(6, 'daylight_savings_end', DataType_1.DataType.DATE_TIME, true);
        this.registerAttribute(7, 'daylight_savings_deviation', DataType_1.DataType.INT8, true);
        this.registerAttribute(8, 'daylight_savings_enabled', DataType_1.DataType.BOOLEAN, true);
        this.registerAttribute(9, 'clock_base', DataType_1.DataType.ENUM, true);
        // Register class methods
        this.registerMethod(1, 'adjust_to_quarter');
        this.registerMethod(2, 'adjust_to_measuring_period');
        this.registerMethod(3, 'adjust_to_minute');
        this.registerMethod(4, 'adjust_to_preset_time');
        this.registerMethod(5, 'preset_adjusting_time');
        this.registerMethod(6, 'shift_time');
    }
    /**
     * Get time
     */
    getTime() {
        return new Date(this.time);
    }
    /**
     * Set time
     */
    setTime(time) {
        this.time = new Date(time);
        this.updateStatus();
    }
    /**
     * Get time zone
     */
    getTimeZone() {
        return this.timeZone;
    }
    /**
     * Set time zone
     */
    setTimeZone(timeZone) {
        if (timeZone < -720 || timeZone > 720) {
            throw new Error('Time zone must be between -720 and 720 minutes');
        }
        this.timeZone = timeZone;
    }
    /**
     * Get status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Set status
     */
    setStatus(status) {
        if (status < 0 || status > 255) {
            throw new Error('Status must be between 0 and 255');
        }
        this.status = status;
    }
    /**
     * Get daylight savings begin
     */
    getDaylightSavingsBegin() {
        return new Date(this.daylightSavingsBegin);
    }
    /**
     * Set daylight savings begin
     */
    setDaylightSavingsBegin(time) {
        this.daylightSavingsBegin = new Date(time);
    }
    /**
     * Get daylight savings end
     */
    getDaylightSavingsEnd() {
        return new Date(this.daylightSavingsEnd);
    }
    /**
     * Set daylight savings end
     */
    setDaylightSavingsEnd(time) {
        this.daylightSavingsEnd = new Date(time);
    }
    /**
     * Get daylight savings deviation
     */
    getDaylightSavingsDeviation() {
        return this.daylightSavingsDeviation;
    }
    /**
     * Set daylight savings deviation
     */
    setDaylightSavingsDeviation(deviation) {
        if (deviation < -120 || deviation > 120) {
            throw new Error('Daylight savings deviation must be between -120 and 120 minutes');
        }
        this.daylightSavingsDeviation = deviation;
    }
    /**
     * Get daylight savings enabled
     */
    isDaylightSavingsEnabled() {
        return this.daylightSavingsEnabled;
    }
    /**
     * Set daylight savings enabled
     */
    setDaylightSavingsEnabled(enabled) {
        this.daylightSavingsEnabled = enabled;
        this.updateStatus();
    }
    /**
     * Get clock base
     */
    getClockBase() {
        return this.clockBase;
    }
    /**
     * Set clock base
     */
    setClockBase(base) {
        if (base < 0 || base > 255) {
            throw new Error('Clock base must be between 0 and 255');
        }
        this.clockBase = base;
        this.updateStatus();
    }
    /**
     * Update clock status
     */
    updateStatus() {
        let newStatus = this.status & ~(ClockStatus.INVALID_VALUE | ClockStatus.DAYLIGHT_SAVING_ACTIVE);
        // Check if time is valid
        if (isNaN(this.time.getTime())) {
            newStatus |= ClockStatus.INVALID_VALUE;
        }
        // Check if daylight savings is active
        if (this.daylightSavingsEnabled) {
            const now = this.time.getTime();
            const begin = this.daylightSavingsBegin.getTime();
            const end = this.daylightSavingsEnd.getTime();
            if ((begin <= end && now >= begin && now <= end) ||
                (begin > end && (now >= begin || now <= end))) {
                newStatus |= ClockStatus.DAYLIGHT_SAVING_ACTIVE;
            }
        }
        this.status = newStatus;
    }
    /**
     * Handle get request
     */
    handleGet(attributeId) {
        switch (attributeId) {
            case 1:
                return this.getLogicalName().toBuffer();
            case 2:
                return this.getTime();
            case 3:
                return this.getTimeZone();
            case 4:
                return this.getStatus();
            case 5:
                return this.getDaylightSavingsBegin();
            case 6:
                return this.getDaylightSavingsEnd();
            case 7:
                return this.getDaylightSavingsDeviation();
            case 8:
                return this.isDaylightSavingsEnabled();
            case 9:
                return this.getClockBase();
            default:
                throw new Error(`Invalid attribute id ${attributeId} for Clock class`);
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
                if (!(value instanceof Date)) {
                    throw new Error('Time must be a Date object');
                }
                this.setTime(value);
                break;
            case 3:
                if (typeof value !== 'number' || !Number.isInteger(value)) {
                    throw new Error('Time zone must be an integer');
                }
                this.setTimeZone(value);
                break;
            case 4:
                if (typeof value !== 'number' || !Number.isInteger(value)) {
                    throw new Error('Status must be an integer');
                }
                this.setStatus(value);
                break;
            case 5:
                if (!(value instanceof Date)) {
                    throw new Error('Daylight savings begin must be a Date object');
                }
                this.setDaylightSavingsBegin(value);
                break;
            case 6:
                if (!(value instanceof Date)) {
                    throw new Error('Daylight savings end must be a Date object');
                }
                this.setDaylightSavingsEnd(value);
                break;
            case 7:
                if (typeof value !== 'number' || !Number.isInteger(value)) {
                    throw new Error('Daylight savings deviation must be an integer');
                }
                this.setDaylightSavingsDeviation(value);
                break;
            case 8:
                if (typeof value !== 'boolean') {
                    throw new Error('Daylight savings enabled must be a boolean');
                }
                this.setDaylightSavingsEnabled(value);
                break;
            case 9:
                if (typeof value !== 'number' || !Number.isInteger(value)) {
                    throw new Error('Clock base must be an integer');
                }
                this.setClockBase(value);
                break;
            default:
                throw new Error(`Invalid attribute id ${attributeId} for Clock class`);
        }
    }
    /**
     * Handle action request
     */
    handleAction(methodId, params) {
        const now = new Date();
        switch (methodId) {
            case 1: // adjust to quarter
                now.setMinutes(Math.round(now.getMinutes() / 15) * 15);
                now.setSeconds(0);
                now.setMilliseconds(0);
                this.setTime(now);
                break;
            case 2: // adjust to measuring period
                // TODO: Implement measuring period adjustment
                throw new Error('Method not implemented');
            case 3: // adjust to minute
                now.setSeconds(0);
                now.setMilliseconds(0);
                this.setTime(now);
                break;
            case 4: // adjust to preset time
                // TODO: Implement preset time adjustment
                throw new Error('Method not implemented');
            case 5: // preset adjusting time
                if (!params || !(params instanceof Date)) {
                    throw new Error('Preset adjusting time requires a Date parameter');
                }
                this.setTime(params);
                break;
            case 6: // shift time
                if (typeof params !== 'number') {
                    throw new Error('Shift time requires a number parameter');
                }
                const shifted = new Date(this.time.getTime() + params * 1000);
                this.setTime(shifted);
                break;
            default:
                throw new Error(`Invalid method id ${methodId} for Clock class`);
        }
    }
}
exports.Clock = Clock;
