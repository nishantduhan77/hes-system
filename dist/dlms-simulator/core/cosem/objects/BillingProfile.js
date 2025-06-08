"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingProfile = exports.BillingStatus = void 0;
const ProfileGeneric_1 = require("./ProfileGeneric");
const ObisCode_1 = require("../obis/ObisCode");
const Register_1 = require("./Register");
const Clock_1 = require("./Clock");
const Types_1 = require("../data/Types");
/**
 * Billing Status Word Bits
 */
var BillingStatus;
(function (BillingStatus) {
    BillingStatus[BillingStatus["NORMAL"] = 0] = "NORMAL";
    BillingStatus[BillingStatus["POWER_FAIL"] = 1] = "POWER_FAIL";
    BillingStatus[BillingStatus["TIME_CHANGED"] = 2] = "TIME_CHANGED";
    BillingStatus[BillingStatus["BILLING_RESET"] = 4] = "BILLING_RESET";
    BillingStatus[BillingStatus["MD_RESET"] = 8] = "MD_RESET";
    BillingStatus[BillingStatus["PROGRAM_MODE"] = 16] = "PROGRAM_MODE";
    BillingStatus[BillingStatus["CONFIGURATION_CHANGED"] = 32] = "CONFIGURATION_CHANGED";
    BillingStatus[BillingStatus["FIRMWARE_UPGRADED"] = 64] = "FIRMWARE_UPGRADED";
    BillingStatus[BillingStatus["TAMPER_DETECTED"] = 128] = "TAMPER_DETECTED";
    BillingStatus[BillingStatus["BATTERY_LOW"] = 256] = "BATTERY_LOW";
    BillingStatus[BillingStatus["MEMORY_ERROR"] = 512] = "MEMORY_ERROR";
    BillingStatus[BillingStatus["COMMUNICATION_ERROR"] = 1024] = "COMMUNICATION_ERROR";
    BillingStatus[BillingStatus["CLOCK_INVALID"] = 2048] = "CLOCK_INVALID";
})(BillingStatus || (exports.BillingStatus = BillingStatus = {}));
/**
 * Billing Profile Class
 * OBIS Code: 1.0.98.1.0.255
 *
 * Notes:
 * 1. Import registers behave as forwarded registers when metering mode configured forwarded only mode
 * 2. Maximum 8 TOU support, TZ1-TZ8 is TOU 1-8
 * 3. Billing Profile data rollover after 12-Last Bills and 1-Current Bill
 * 4. Time should be in HH:MM:SS format for any data/command
 */
class BillingProfile extends ProfileGeneric_1.ProfileGeneric {
    constructor() {
        const profileObisCode = ObisCode_1.ObisCode.fromString('1.0.98.1.0.255');
        super(profileObisCode, BillingProfile.MAX_ENTRIES);
        // Initialize properties with default values
        this.billingDate = new Clock_1.Clock(ObisCode_1.ObisCode.fromString('0.0.1.2.255'));
        this.systemPowerFactor = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.13.0.0.255'), Types_1.Unit.NONE, 0);
        // Energy Import Registers
        this.whImportRegisters = [];
        this.vahImportRegisters = [];
        // Maximum Demand Registers
        this.mdWImportRegisters = [];
        this.mdWImportTimeRegisters = [];
        this.mdVAImportRegisters = [];
        this.mdVAImportTimeRegisters = [];
        // Additional Registers
        this.billingPowerOnDuration = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.94.91.13.255'), Types_1.Unit.NONE, 0);
        this.whExport = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.2.8.0.255'), Types_1.Unit.WATT_HOUR, 0);
        this.varhRegisters = [];
        // Billing Status
        this.billingStatusWord = BillingStatus.NORMAL;
        this.billingResetCount = 0;
        this.lastResetDateTime = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.1.2.0.255'), Types_1.Unit.NONE, 0);
        this.initializeRegisters();
        this.setupCaptureObjects();
    }
    initializeRegisters() {
        // Initialize Wh Import Registers for each tariff zone
        for (let i = 1; i <= BillingProfile.MAX_TARIFF_ZONES; i++) {
            this.whImportRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(`1.0.1.8.${i}.255`), Types_1.Unit.WATT_HOUR, 0));
        }
        // Initialize VAh Import Registers for each tariff zone
        for (let i = 1; i <= BillingProfile.MAX_TARIFF_ZONES; i++) {
            this.vahImportRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(`1.0.9.8.${i}.255`), Types_1.Unit.VOLT_AMPERE_HOUR, 0));
        }
        // Initialize MD W Import Registers and their time registers
        for (let i = 1; i <= BillingProfile.MAX_TARIFF_ZONES; i++) {
            this.mdWImportRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(`1.0.1.6.${i}.255`), Types_1.Unit.WATT, 0));
            this.mdWImportTimeRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(`1.0.1.6.${i}.255`), Types_1.Unit.NONE, 0));
        }
        // Initialize MD VA Import Registers and their time registers
        for (let i = 1; i <= BillingProfile.MAX_TARIFF_ZONES; i++) {
            this.mdVAImportRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(`1.0.9.6.${i}.255`), Types_1.Unit.VOLT_AMPERE, 0));
            this.mdVAImportTimeRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(`1.0.9.6.${i}.255`), Types_1.Unit.NONE, 0));
        }
        // Initialize VArh Registers (Q1-Q4)
        const varhObis = ['1.0.5.8.0.255', '1.0.6.8.0.255', '1.0.7.8.0.255', '1.0.8.8.0.255'];
        varhObis.forEach(obis => {
            this.varhRegisters.push(new Register_1.Register(ObisCode_1.ObisCode.fromString(obis), Types_1.Unit.VAR_HOUR, 0));
        });
    }
    setupCaptureObjects() {
        // Add billing date and system power factor
        this.addCaptureObject({
            classId: this.billingDate.getClassId(),
            logicalName: this.billingDate.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        this.addCaptureObject({
            classId: this.systemPowerFactor.getClassId(),
            logicalName: this.systemPowerFactor.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        // Add Wh Import registers
        this.whImportRegisters.forEach(reg => {
            this.addCaptureObject({
                classId: reg.getClassId(),
                logicalName: reg.getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
        });
        // Add VAh Import registers
        this.vahImportRegisters.forEach(reg => {
            this.addCaptureObject({
                classId: reg.getClassId(),
                logicalName: reg.getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
        });
        // Add MD W Import registers and their time registers
        for (let i = 0; i < this.mdWImportRegisters.length; i++) {
            this.addCaptureObject({
                classId: this.mdWImportRegisters[i].getClassId(),
                logicalName: this.mdWImportRegisters[i].getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
            this.addCaptureObject({
                classId: this.mdWImportTimeRegisters[i].getClassId(),
                logicalName: this.mdWImportTimeRegisters[i].getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
        }
        // Add MD VA Import registers and their time registers
        for (let i = 0; i < this.mdVAImportRegisters.length; i++) {
            this.addCaptureObject({
                classId: this.mdVAImportRegisters[i].getClassId(),
                logicalName: this.mdVAImportRegisters[i].getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
            this.addCaptureObject({
                classId: this.mdVAImportTimeRegisters[i].getClassId(),
                logicalName: this.mdVAImportTimeRegisters[i].getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
        }
        // Add billing power on duration
        this.addCaptureObject({
            classId: this.billingPowerOnDuration.getClassId(),
            logicalName: this.billingPowerOnDuration.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        // Add Wh Export register
        this.addCaptureObject({
            classId: this.whExport.getClassId(),
            logicalName: this.whExport.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
        // Add VArh registers (Q1-Q4)
        this.varhRegisters.forEach(reg => {
            this.addCaptureObject({
                classId: reg.getClassId(),
                logicalName: reg.getLogicalName(),
                attributeIndex: 2,
                dataIndex: 0
            });
        });
        // Add billing status and reset count
        this.addCaptureObject({
            classId: 3, // Register class
            logicalName: ObisCode_1.ObisCode.fromString('0.0.96.10.1.255'), // Billing status
            attributeIndex: 2,
            dataIndex: 0
        });
        this.addCaptureObject({
            classId: 3, // Register class
            logicalName: ObisCode_1.ObisCode.fromString('0.0.96.15.0.255'), // Reset count
            attributeIndex: 2,
            dataIndex: 0
        });
    }
    /**
     * Update billing measurements
     */
    updateMeasurements(measurements) {
        if (measurements.systemPowerFactor !== undefined) {
            this.systemPowerFactor.setValue(measurements.systemPowerFactor);
        }
        if (measurements.whImport) {
            measurements.whImport.forEach((value, index) => {
                if (index < this.whImportRegisters.length) {
                    this.whImportRegisters[index].setValue(value);
                }
            });
        }
        if (measurements.vahImport) {
            measurements.vahImport.forEach((value, index) => {
                if (index < this.vahImportRegisters.length) {
                    this.vahImportRegisters[index].setValue(value);
                }
            });
        }
        if (measurements.mdWImport) {
            measurements.mdWImport.forEach((value, index) => {
                if (index < this.mdWImportRegisters.length) {
                    this.mdWImportRegisters[index].setValue(value);
                }
            });
        }
        if (measurements.mdWImportTime) {
            measurements.mdWImportTime.forEach((date, index) => {
                if (index < this.mdWImportTimeRegisters.length) {
                    this.mdWImportTimeRegisters[index].setValue(date.getTime());
                }
            });
        }
        if (measurements.mdVAImport) {
            measurements.mdVAImport.forEach((value, index) => {
                if (index < this.mdVAImportRegisters.length) {
                    this.mdVAImportRegisters[index].setValue(value);
                }
            });
        }
        if (measurements.mdVAImportTime) {
            measurements.mdVAImportTime.forEach((date, index) => {
                if (index < this.mdVAImportTimeRegisters.length) {
                    this.mdVAImportTimeRegisters[index].setValue(date.getTime());
                }
            });
        }
        if (measurements.powerOnDuration !== undefined) {
            this.billingPowerOnDuration.setValue(measurements.powerOnDuration);
        }
        if (measurements.whExport !== undefined) {
            this.whExport.setValue(measurements.whExport);
        }
        if (measurements.varhQ1 !== undefined) {
            this.varhRegisters[0].setValue(measurements.varhQ1);
        }
        if (measurements.varhQ2 !== undefined) {
            this.varhRegisters[1].setValue(measurements.varhQ2);
        }
        if (measurements.varhQ3 !== undefined) {
            this.varhRegisters[2].setValue(measurements.varhQ3);
        }
        if (measurements.varhQ4 !== undefined) {
            this.varhRegisters[3].setValue(measurements.varhQ4);
        }
    }
    /**
     * Reset billing data and increment reset count
     */
    async resetBilling() {
        // Store current values before reset
        await this.capture();
        // Reset maximum demand registers
        this.mdWImportRegisters.forEach(reg => reg.setValue(0));
        this.mdWImportTimeRegisters.forEach(reg => reg.setValue(0));
        this.mdVAImportRegisters.forEach(reg => reg.setValue(0));
        this.mdVAImportTimeRegisters.forEach(reg => reg.setValue(0));
        // Update billing status
        this.billingStatusWord |= BillingStatus.BILLING_RESET;
        this.billingResetCount++;
        this.lastResetDateTime.setValue(Date.now());
        // Capture new values after reset
        await this.capture();
    }
    /**
     * Get billing values
     */
    getBillingValues() {
        return {
            systemPowerFactor: this.systemPowerFactor.getValue(),
            whImport: this.whImportRegisters.map(reg => reg.getValue()),
            vahImport: this.vahImportRegisters.map(reg => reg.getValue()),
            mdWImport: this.mdWImportRegisters.map(reg => reg.getValue()),
            mdWImportTime: this.mdWImportTimeRegisters.map(reg => reg.getValue()),
            mdVAImport: this.mdVAImportRegisters.map(reg => reg.getValue()),
            mdVAImportTime: this.mdVAImportTimeRegisters.map(reg => reg.getValue()),
            powerOnDuration: this.billingPowerOnDuration.getValue(),
            whExport: this.whExport.getValue(),
            varhValues: this.varhRegisters.map(reg => reg.getValue()),
            billingStatus: this.billingStatusWord,
            resetCount: this.billingResetCount,
            lastResetTime: this.lastResetDateTime.getValue()
        };
    }
    /**
     * Update billing status
     */
    updateBillingStatus(status) {
        this.billingStatusWord |= status;
    }
    /**
     * Clear billing status bits
     */
    clearBillingStatus(status) {
        this.billingStatusWord &= ~status;
    }
    /**
     * Get current billing status
     */
    getBillingStatus() {
        return this.billingStatusWord;
    }
    /**
     * Get billing reset count
     */
    getBillingResetCount() {
        return this.billingResetCount;
    }
    /**
     * Get last reset time
     */
    getLastResetTime() {
        return this.lastResetDateTime.getValue();
    }
    /**
     * Validate billing date
     */
    validateBillingDate(date) {
        const currentDate = new Date();
        // Billing date should not be in the future
        if (date > currentDate) {
            return false;
        }
        // Billing date should not be more than 90 days in the past
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        if (date < ninetyDaysAgo) {
            return false;
        }
        return true;
    }
    /**
     * Override capture method to include billing status
     */
    capture() {
        // Add billing status to capture objects if not already present
        const captureObjects = this.getAttribute(3).getValue();
        const hasBillingStatus = captureObjects.some((obj) => obj.logicalName.toString() === '0.0.96.10.1.255');
        if (!hasBillingStatus) {
            this.addCaptureObject({
                classId: 3,
                logicalName: ObisCode_1.ObisCode.fromString('0.0.96.10.1.255'),
                attributeIndex: 2,
                dataIndex: 0
            });
        }
        super.capture();
    }
}
exports.BillingProfile = BillingProfile;
// Constants
BillingProfile.MAX_ENTRIES = 13; // 12 last bills + 1 current bill
BillingProfile.MAX_TARIFF_ZONES = 8; // TZ1-TZ8
