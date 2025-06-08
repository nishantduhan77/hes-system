"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TamperEventsProfile = exports.EventType = void 0;
const ProfileGeneric_1 = require("./ProfileGeneric");
const ObisCode_1 = require("../obis/ObisCode");
const Register_1 = require("./Register");
const Clock_1 = require("./Clock");
const Types_1 = require("../data/Types");
/**
 * Event Types for different categories of events
 */
var EventType;
(function (EventType) {
    // Voltage Related Events
    EventType[EventType["VOLTAGE_MISSING"] = 1] = "VOLTAGE_MISSING";
    EventType[EventType["VOLTAGE_UNBALANCE"] = 2] = "VOLTAGE_UNBALANCE";
    EventType[EventType["VOLTAGE_HIGH"] = 3] = "VOLTAGE_HIGH";
    EventType[EventType["VOLTAGE_LOW"] = 4] = "VOLTAGE_LOW";
    EventType[EventType["VOLTAGE_SWELL"] = 5] = "VOLTAGE_SWELL";
    EventType[EventType["VOLTAGE_SAG_DIP"] = 6] = "VOLTAGE_SAG_DIP";
    EventType[EventType["OVER_VOLTAGE"] = 7] = "OVER_VOLTAGE";
    EventType[EventType["LOW_VOLTAGE"] = 8] = "LOW_VOLTAGE";
    EventType[EventType["VOLTAGE_UNBALANCE_OCCURRENCE"] = 9] = "VOLTAGE_UNBALANCE_OCCURRENCE";
    EventType[EventType["VOLTAGE_UNBALANCE_RESTORATION"] = 10] = "VOLTAGE_UNBALANCE_RESTORATION";
    EventType[EventType["PHASE_SEQUENCE_REVERSAL_OCCURRENCE"] = 11] = "PHASE_SEQUENCE_REVERSAL_OCCURRENCE";
    EventType[EventType["PHASE_SEQUENCE_REVERSAL_RESTORATION"] = 12] = "PHASE_SEQUENCE_REVERSAL_RESTORATION";
    // Current Related Events
    EventType[EventType["CURRENT_MISSING"] = 51] = "CURRENT_MISSING";
    EventType[EventType["CURRENT_UNBALANCE"] = 52] = "CURRENT_UNBALANCE";
    EventType[EventType["CURRENT_REVERSAL"] = 53] = "CURRENT_REVERSAL";
    EventType[EventType["CT_OPEN"] = 54] = "CT_OPEN";
    EventType[EventType["CT_REVERSAL"] = 55] = "CT_REVERSAL";
    EventType[EventType["CT_SHORT"] = 56] = "CT_SHORT";
    EventType[EventType["CURRENT_BYPASS"] = 57] = "CURRENT_BYPASS";
    EventType[EventType["OVER_CURRENT"] = 58] = "OVER_CURRENT";
    EventType[EventType["HIGH_NEUTRAL_CURRENT"] = 59] = "HIGH_NEUTRAL_CURRENT";
    // Power Related Events
    EventType[EventType["POWER_FAILURE"] = 101] = "POWER_FAILURE";
    EventType[EventType["POWER_RESTORATION"] = 102] = "POWER_RESTORATION";
    // Transaction Events
    EventType[EventType["PF_RATIO_CHANGE"] = 125] = "PF_RATIO_CHANGE";
    EventType[EventType["CT_PT_RATIO_CHANGE"] = 126] = "CT_PT_RATIO_CHANGE";
    EventType[EventType["VT_CONNECTION_CHANGE"] = 127] = "VT_CONNECTION_CHANGE";
    EventType[EventType["REAL_TIME_CLOCK"] = 131] = "REAL_TIME_CLOCK";
    EventType[EventType["DEMAND_INTEGRATION_PERIOD"] = 132] = "DEMAND_INTEGRATION_PERIOD";
    EventType[EventType["PROFILE_CAPTURE_PERIOD"] = 133] = "PROFILE_CAPTURE_PERIOD";
    EventType[EventType["SINGLE_ACTION_SCHEDULE"] = 134] = "SINGLE_ACTION_SCHEDULE";
    EventType[EventType["BILLING_DATE"] = 135] = "BILLING_DATE";
    EventType[EventType["ACTIVITY_CALENDAR"] = 136] = "ACTIVITY_CALENDAR";
    EventType[EventType["TOU_CHANGE"] = 141] = "TOU_CHANGE";
    EventType[EventType["MD_RESET"] = 142] = "MD_RESET";
    EventType[EventType["IMAGE_ACTIVATION"] = 151] = "IMAGE_ACTIVATION";
    EventType[EventType["GLOBAL_KEY_CHANGE"] = 164] = "GLOBAL_KEY_CHANGE";
    EventType[EventType["FIRMWARE_UPGRADE"] = 165] = "FIRMWARE_UPGRADE";
    // Other Events
    EventType[EventType["PERMANENT_MAGNET"] = 201] = "PERMANENT_MAGNET";
    EventType[EventType["NEUTRAL_DISTURBANCE"] = 203] = "NEUTRAL_DISTURBANCE";
    EventType[EventType["COMMUNICATION_DISTURBANCE"] = 210] = "COMMUNICATION_DISTURBANCE";
    EventType[EventType["OVERLOAD"] = 211] = "OVERLOAD";
    EventType[EventType["TEMPERATURE_RISE"] = 889] = "TEMPERATURE_RISE";
    EventType[EventType["WRONG_PHASE_ASSOCIATION"] = 888] = "WRONG_PHASE_ASSOCIATION";
    EventType[EventType["PHASE_ASSOCIATION_RESTORATION"] = 889] = "PHASE_ASSOCIATION_RESTORATION";
    EventType[EventType["ENERGY_MISMATCH"] = 890] = "ENERGY_MISMATCH";
    EventType[EventType["COVER_OPEN"] = 901] = "COVER_OPEN";
})(EventType || (exports.EventType = EventType = {}));
/**
 * Tamper Events Profile Class
 * OBIS Code: 0.0.99.98.0.255
 *
 * Notes:
 * 1. Rollover at 150 entries for voltage related events
 * 2. Rollover at 150 entries for current related events
 * 3. Rollover at 50 entries for power related events
 * 4. Rollover at 100 entries for other events
 */
class TamperEventsProfile extends ProfileGeneric_1.ProfileGeneric {
    constructor() {
        const profileObisCode = ObisCode_1.ObisCode.fromString('0.0.99.98.0.255');
        // Using 150 as max entries (voltage events limit, which is highest)
        super(profileObisCode, 150);
        // Event Log Objects
        this.eventDateTime = new Clock_1.Clock(ObisCode_1.ObisCode.fromString('0.0.1.0.0.255'));
        this.eventCode = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.96.11.0.255'), Types_1.Unit.NONE, 0);
        // Electrical Parameters at Event Time
        this.currentRegisters = [];
        this.voltageRegisters = [];
        this.powerFactorRegister = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.13.7.0.255'), Types_1.Unit.NONE, 0);
        this.activePowerRegister = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.1.7.0.255'), Types_1.Unit.WATT, 0);
        this.apparentPowerRegister = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.9.7.0.255'), Types_1.Unit.VOLT_AMPERE, 0);
        // Energy Values at Event Time
        this.whImportRegister = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.1.8.0.255'), Types_1.Unit.WATT_HOUR, 0);
        this.whExportRegister = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.2.8.0.255'), Types_1.Unit.WATT_HOUR, 0);
        // Event Sequence Number
        this.sequenceNumber = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.96.11.0.255'), Types_1.Unit.NONE, 0);
        this.initializeRegisters();
        this.setupCaptureObjects();
    }
    initializeRegisters() {
        // Initialize Current Registers (IR, IY, IB)
        const currentObis = ['1.0.31.7.0.255', '1.0.51.7.0.255', '1.0.71.7.0.255'];
        currentObis.forEach(obis => {
            this.currentRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(obis), Types_1.Unit.AMPERE, -2) // Scaler -2 as per spec
            );
        });
        // Initialize Voltage Registers (VR, VY, VB)
        const voltageObis = ['1.0.32.7.0.255', '1.0.52.7.0.255', '1.0.72.7.0.255'];
        voltageObis.forEach(obis => {
            this.voltageRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(obis), Types_1.Unit.VOLT, -1) // Scaler -1 as per spec
            );
        });
    }
    setupCaptureObjects() {
        // Add event date/time and code
        this.addCaptureObject({
            classId: this.eventDateTime.getClassId(),
            logicalName: this.eventDateTime.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        this.addCaptureObject({
            classId: this.eventCode.getClassId(),
            logicalName: this.eventCode.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        // Add current registers
        this.currentRegisters.forEach(reg => {
            this.addCaptureObject({
                classId: reg.getClassId(),
                logicalName: reg.getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
        });
        // Add voltage registers
        this.voltageRegisters.forEach(reg => {
            this.addCaptureObject({
                classId: reg.getClassId(),
                logicalName: reg.getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
        });
        // Add power factor and power registers
        this.addCaptureObject({
            classId: this.powerFactorRegister.getClassId(),
            logicalName: this.powerFactorRegister.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        this.addCaptureObject({
            classId: this.activePowerRegister.getClassId(),
            logicalName: this.activePowerRegister.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        this.addCaptureObject({
            classId: this.apparentPowerRegister.getClassId(),
            logicalName: this.apparentPowerRegister.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        // Add energy registers
        this.addCaptureObject({
            classId: this.whImportRegister.getClassId(),
            logicalName: this.whImportRegister.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        this.addCaptureObject({
            classId: this.whExportRegister.getClassId(),
            logicalName: this.whExportRegister.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        // Add sequence number
        this.addCaptureObject({
            classId: this.sequenceNumber.getClassId(),
            logicalName: this.sequenceNumber.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
    }
    /**
     * Record a tamper event with current electrical parameters
     */
    recordEvent(eventType, measurements) {
        // Set event code and timestamp
        this.eventCode.setValue(eventType);
        this.sequenceNumber.setValue(this.sequenceNumber.getValue() + 1);
        // Update electrical parameters if provided
        if (measurements.currents) {
            measurements.currents.forEach((value, index) => {
                if (index < this.currentRegisters.length) {
                    this.currentRegisters[index].setValue(value);
                }
            });
        }
        if (measurements.voltages) {
            measurements.voltages.forEach((value, index) => {
                if (index < this.voltageRegisters.length) {
                    this.voltageRegisters[index].setValue(value);
                }
            });
        }
        if (measurements.powerFactor !== undefined) {
            this.powerFactorRegister.setValue(measurements.powerFactor);
        }
        if (measurements.activePower !== undefined) {
            this.activePowerRegister.setValue(measurements.activePower);
        }
        if (measurements.apparentPower !== undefined) {
            this.apparentPowerRegister.setValue(measurements.apparentPower);
        }
        if (measurements.whImport !== undefined) {
            this.whImportRegister.setValue(measurements.whImport);
        }
        if (measurements.whExport !== undefined) {
            this.whExportRegister.setValue(measurements.whExport);
        }
        // Capture the event
        this.capture();
    }
    /**
     * Get the latest event details
     */
    getLatestEventDetails() {
        return {
            eventType: this.eventCode.getValue(),
            timestamp: this.eventDateTime.getCurrentTime(),
            sequenceNumber: this.sequenceNumber.getValue(),
            currents: this.currentRegisters.map(reg => reg.getValue()),
            voltages: this.voltageRegisters.map(reg => reg.getValue()),
            powerFactor: this.powerFactorRegister.getValue(),
            activePower: this.activePowerRegister.getValue(),
            apparentPower: this.apparentPowerRegister.getValue(),
            whImport: this.whImportRegister.getValue(),
            whExport: this.whExportRegister.getValue()
        };
    }
}
exports.TamperEventsProfile = TamperEventsProfile;
