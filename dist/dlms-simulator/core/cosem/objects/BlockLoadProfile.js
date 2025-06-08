"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockLoadProfile = exports.MeterHealthError = void 0;
const ProfileGeneric_1 = require("./ProfileGeneric");
const ObisCode_1 = require("../obis/ObisCode");
const Register_1 = require("./Register");
const Clock_1 = require("./Clock");
const Types_1 = require("../data/Types");
/**
 * Error codes for Meter Health Indicator
 */
var MeterHealthError;
(function (MeterHealthError) {
    MeterHealthError[MeterHealthError["NO_ERROR"] = 0] = "NO_ERROR";
    MeterHealthError[MeterHealthError["RTC_ERROR"] = 1] = "RTC_ERROR";
    MeterHealthError[MeterHealthError["MEASUREMENT_ERROR"] = 2] = "MEASUREMENT_ERROR";
    MeterHealthError[MeterHealthError["NVM_ERROR"] = 3] = "NVM_ERROR";
    MeterHealthError[MeterHealthError["DISPLAY_ERROR"] = 4] = "DISPLAY_ERROR";
    MeterHealthError[MeterHealthError["WATCHDOG_ERROR"] = 5] = "WATCHDOG_ERROR";
    MeterHealthError[MeterHealthError["CALIBRATION_ERROR"] = 6] = "CALIBRATION_ERROR";
    MeterHealthError[MeterHealthError["FIRMWARE_ERROR"] = 7] = "FIRMWARE_ERROR";
    MeterHealthError[MeterHealthError["MEMORY_ERROR"] = 8] = "MEMORY_ERROR";
    MeterHealthError[MeterHealthError["COMMUNICATION_ERROR"] = 9] = "COMMUNICATION_ERROR";
    MeterHealthError[MeterHealthError["BATTERY_ERROR"] = 10] = "BATTERY_ERROR";
    MeterHealthError[MeterHealthError["POWER_ERROR"] = 11] = "POWER_ERROR";
    MeterHealthError[MeterHealthError["TAMPER_ERROR"] = 12] = "TAMPER_ERROR"; // Err 12: Tamper Error
})(MeterHealthError || (exports.MeterHealthError = MeterHealthError = {}));
/**
 * Block Load Profile Class
 * OBIS Code: 1.0.99.1.0.255
 *
 * Notes:
 * 1. Import registers behave as forwarded register when metering mode configured forwarded only mode
 * 2. Block load profile data rollover after 90 days for 30 minute IP and 45 days for 15 minute IP
 * 3. Time should be in HH:MM:SS format for any data/command
 *
 * OBIS Codes Used:
 * - Profile Object:        1.0.99.1.0.255
 * - RTC:                  0.0.1.0.0.255
 * - Current.Ir:           1.0.31.27.0.255  (Scaler -2, unit A)
 * - Current.Iy:           1.0.51.27.0.255  (Scaler -2, unit A)
 * - Current.Ib:           1.0.71.27.0.255  (Scaler -2, unit A)
 * - Voltage.Vrn:          1.0.32.27.0.255  (Scaler -1, unit V)
 * - Voltage.Vyn:          1.0.52.27.0.255  (Scaler -1, unit V)
 * - Voltage.Vbn:          1.0.72.27.0.255  (Scaler -1, unit V)
 * - Energy - Wh Import:   1.0.1.29.0.255   (Scaler 0, unit Wh)
 * - Energy - VAh Import:  1.0.9.29.0.255   (Scaler 0, unit VAh)
 * - Energy - Wh Export:   1.0.2.29.0.255   (Scaler 0, unit Wh)
 * - Energy - VAh Export:  1.0.10.29.0.255  (Scaler 0, unit VAh)
 * - Meter Health:         0.0.96.10.1.255
 * - Signal Strength:      0.1.96.12.5.255
 */
class BlockLoadProfile extends ProfileGeneric_1.ProfileGeneric {
    constructor(captureInterval = 1800) {
        const profileObisCode = ObisCode_1.ObisCode.fromString('1.0.99.1.0.255');
        // Calculate max entries based on capture interval
        const maxEntries = captureInterval === 1800 ?
            2880 : // 90 days * 48 captures per day for 30 min interval
            4320; // 45 days * 96 captures per day for 15 min interval
        super(profileObisCode, maxEntries);
        // Initialize properties with default values
        this.rtcClock = new Clock_1.Clock(ObisCode_1.ObisCode.fromString('0.0.1.0.0.255'));
        this.currentRegisters = [];
        this.voltageRegisters = [];
        this.energyRegisters = [];
        this.initializeRegisters();
        this.setupCaptureObjects();
        this.setCapturePeriod(captureInterval);
    }
    initializeRegisters() {
        // Initialize Current Registers (IR, IY, IB) with scaler (-2)
        this.currentRegisters = [
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.31.27.0.255'), Types_1.Unit.AMPERE, -2),
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.51.27.0.255'), Types_1.Unit.AMPERE, -2),
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.71.27.0.255'), Types_1.Unit.AMPERE, -2)
        ];
        // Initialize Voltage Registers (VRN, VYN, VBN) with scaler (-1)
        this.voltageRegisters = [
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.32.27.0.255'), Types_1.Unit.VOLT, -1),
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.52.27.0.255'), Types_1.Unit.VOLT, -1),
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.72.27.0.255'), Types_1.Unit.VOLT, -1)
        ];
        // Initialize Energy Registers with scaler (0)
        this.energyRegisters = [
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.1.29.0.255'), Types_1.Unit.WATT_HOUR, 0), // Wh Import
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.9.29.0.255'), Types_1.Unit.VOLT_AMPERE_HOUR, 0), // VAh Import
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.2.29.0.255'), Types_1.Unit.WATT_HOUR, 0), // Wh Export
            new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.10.29.0.255'), Types_1.Unit.VOLT_AMPERE_HOUR, 0) // VAh Export
        ];
        // Initialize Meter Health Indicator
        this.meterHealthIndicator = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.96.10.1.255'), Types_1.Unit.NONE, 0);
        // Initialize Signal Strength (RSSI)
        this.signalStrength = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.1.96.12.5.255'), Types_1.Unit.NONE, 0);
    }
    setupCaptureObjects() {
        // Add RTC as first capture object
        this.addCaptureObject(this.rtcClock);
        // Add all registers as capture objects
        this.currentRegisters.forEach(reg => this.addCaptureObject(reg));
        this.voltageRegisters.forEach(reg => this.addCaptureObject(reg));
        this.energyRegisters.forEach(reg => this.addCaptureObject(reg));
        this.addCaptureObject(this.meterHealthIndicator);
        this.addCaptureObject(this.signalStrength);
    }
    /**
     * Update profile measurements
     */
    updateMeasurements(measurements) {
        if (measurements.currents) {
            measurements.currents.forEach((value, i) => {
                if (i < this.currentRegisters.length) {
                    this.currentRegisters[i].setValue(value);
                }
            });
        }
        if (measurements.voltages) {
            measurements.voltages.forEach((value, i) => {
                if (i < this.voltageRegisters.length) {
                    this.voltageRegisters[i].setValue(value);
                }
            });
        }
        if (measurements.whImport !== undefined) {
            this.energyRegisters[0].setValue(measurements.whImport);
        }
        if (measurements.vahImport !== undefined) {
            this.energyRegisters[1].setValue(measurements.vahImport);
        }
        if (measurements.whExport !== undefined) {
            this.energyRegisters[2].setValue(measurements.whExport);
        }
        if (measurements.vahExport !== undefined) {
            this.energyRegisters[3].setValue(measurements.vahExport);
        }
        if (measurements.meterHealth !== undefined) {
            this.setMeterHealth(measurements.meterHealth);
        }
        if (measurements.signalStrength !== undefined) {
            this.setSignalStrength(measurements.signalStrength);
        }
    }
    /**
     * Set meter health indicator with validation
     */
    setMeterHealth(errorCode) {
        if (errorCode < MeterHealthError.NO_ERROR || errorCode > MeterHealthError.TAMPER_ERROR) {
            throw new Error(`Invalid meter health error code: ${errorCode}. Must be between 0 and 12.`);
        }
        this.meterHealthIndicator.setValue(errorCode);
    }
    /**
     * Get meter health indicator error code
     * Returns error code (Err 00 to Err 12)
     */
    getMeterHealthError() {
        return this.meterHealthIndicator.getValue();
    }
    /**
     * Set signal strength (RSSI) with validation
     */
    setSignalStrength(rssi) {
        // Typical RSSI range is -120 dBm to 0 dBm
        if (rssi < -120 || rssi > 0) {
            throw new Error(`Invalid RSSI value: ${rssi}. Must be between -120 and 0 dBm.`);
        }
        this.signalStrength.setValue(rssi);
    }
    /**
     * Get signal strength (RSSI)
     */
    getSignalStrength() {
        return this.signalStrength.getValue();
    }
    /**
     * Get error description for meter health code
     */
    getMeterHealthDescription(errorCode) {
        const descriptions = {
            [MeterHealthError.NO_ERROR]: "No Error",
            [MeterHealthError.RTC_ERROR]: "RTC Error",
            [MeterHealthError.MEASUREMENT_ERROR]: "Measurement Error",
            [MeterHealthError.NVM_ERROR]: "NVM Error",
            [MeterHealthError.DISPLAY_ERROR]: "Display Error",
            [MeterHealthError.WATCHDOG_ERROR]: "Watchdog Error",
            [MeterHealthError.CALIBRATION_ERROR]: "Calibration Error",
            [MeterHealthError.FIRMWARE_ERROR]: "Firmware Error",
            [MeterHealthError.MEMORY_ERROR]: "Memory Error",
            [MeterHealthError.COMMUNICATION_ERROR]: "Communication Error",
            [MeterHealthError.BATTERY_ERROR]: "Battery Error",
            [MeterHealthError.POWER_ERROR]: "Power Error",
            [MeterHealthError.TAMPER_ERROR]: "Tamper Error"
        };
        return descriptions[errorCode] || "Unknown Error";
    }
    /**
     * Capture current values
     */
    capture() {
        super.capture();
    }
}
exports.BlockLoadProfile = BlockLoadProfile;
