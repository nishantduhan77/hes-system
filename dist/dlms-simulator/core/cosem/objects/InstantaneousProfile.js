"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantaneousProfile = void 0;
const ProfileGeneric_1 = require("./ProfileGeneric");
const ObisCode_1 = require("../obis/ObisCode");
const Register_1 = require("./Register");
const Clock_1 = require("./Clock");
const Types_1 = require("../data/Types");
/**
 * Instantaneous Parameters Profile Class
 * OBIS Code: 1.0.94.91.0.255
 */
class InstantaneousProfile extends ProfileGeneric_1.ProfileGeneric {
    constructor() {
        const profileObisCode = new ObisCode_1.ObisCode('1.0.94.91.0.255');
        super(profileObisCode, 1); // maxEntries = 1 for instantaneous profile
        this.initializeRegisters();
        this.setupCaptureObjects();
    }
    initializeRegisters() {
        // Initialize RTC
        this.rtcClock = new Clock_1.Clock(new ObisCode_1.ObisCode('0.0.1.0.0.255'));
        // Initialize Current Registers (IR, IY, IB)
        this.currentRegisters = [
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.31.7.0.255'), Types_1.Unit.AMPERE, 0),
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.51.7.0.255'), Types_1.Unit.AMPERE, 0),
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.71.7.0.255'), Types_1.Unit.AMPERE, 0)
        ];
        // Initialize Voltage Registers (VRN, VYN, VBN)
        this.voltageRegisters = [
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.32.7.0.255'), Types_1.Unit.VOLT, 0),
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.52.7.0.255'), Types_1.Unit.VOLT, 0),
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.72.7.0.255'), Types_1.Unit.VOLT, 0)
        ];
        // Initialize Power Factor Registers
        this.powerFactorRegisters = [
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.33.7.0.255'), Types_1.Unit.NONE, 0),
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.53.7.0.255'), Types_1.Unit.NONE, 0),
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.73.7.0.255'), Types_1.Unit.NONE, 0)
        ];
        // Initialize Power Registers
        this.powerRegisters = [
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.1.7.0.255'), Types_1.Unit.WATT, 0), // Active Power
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.3.7.0.255'), Types_1.Unit.VAR, 0), // Reactive Power
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.9.7.0.255'), Types_1.Unit.VOLT_AMPERE, 0) // Apparent Power
        ];
        // Initialize Energy Registers
        this.energyRegisters = [
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.1.8.0.255'), Types_1.Unit.WATT_HOUR, 0), // Active Energy Import
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.2.8.0.255'), Types_1.Unit.WATT_HOUR, 0), // Active Energy Export
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.3.8.0.255'), Types_1.Unit.VAR_HOUR, 0), // Reactive Energy Import
            new Register_1.Register(new ObisCode_1.ObisCode('1.0.4.8.0.255'), Types_1.Unit.VAR_HOUR, 0) // Reactive Energy Export
        ];
        // Initialize Frequency Register
        this.frequencyRegister = new Register_1.Register(new ObisCode_1.ObisCode('1.0.14.7.0.255'), Types_1.Unit.HERTZ, 0);
        // Initialize Counters
        this.counters = [
            new Register_1.Register(new ObisCode_1.ObisCode('0.0.94.91.0.255'), Types_1.Unit.NONE, 0), // Power Failures
            new Register_1.Register(new ObisCode_1.ObisCode('0.0.94.91.9.255'), Types_1.Unit.NONE, 0), // Tamper Count
            new Register_1.Register(new ObisCode_1.ObisCode('0.0.96.2.0.255'), Types_1.Unit.NONE, 0), // Programming Count
            new Register_1.Register(new ObisCode_1.ObisCode('0.0.96.15.0.255'), Types_1.Unit.NONE, 0) // Billing Count
        ];
    }
    setupCaptureObjects() {
        // Add RTC as first capture object
        this.addCaptureObject(this.rtcClock, 2); // attribute 2 is time
        // Add all registers as capture objects
        this.currentRegisters.forEach(reg => this.addCaptureObject(reg, 2));
        this.voltageRegisters.forEach(reg => this.addCaptureObject(reg, 2));
        this.powerFactorRegisters.forEach(reg => this.addCaptureObject(reg, 2));
        this.powerRegisters.forEach(reg => this.addCaptureObject(reg, 2));
        this.energyRegisters.forEach(reg => this.addCaptureObject(reg, 2));
        this.addCaptureObject(this.frequencyRegister, 2);
        this.counters.forEach(reg => this.addCaptureObject(reg, 2));
    }
    /**
     * Update all register values with new measurements
     */
    updateMeasurements(measurements) {
        if (measurements.currents) {
            measurements.currents.forEach((value, i) => {
                this.currentRegisters[i].setValue(value);
            });
        }
        if (measurements.voltages) {
            measurements.voltages.forEach((value, i) => {
                this.voltageRegisters[i].setValue(value);
            });
        }
        if (measurements.powerFactors) {
            measurements.powerFactors.forEach((value, i) => {
                this.powerFactorRegisters[i].setValue(value);
            });
        }
        if (measurements.activePower !== undefined) {
            this.powerRegisters[0].setValue(measurements.activePower);
        }
        if (measurements.reactivePower !== undefined) {
            this.powerRegisters[1].setValue(measurements.reactivePower);
        }
        if (measurements.apparentPower !== undefined) {
            this.powerRegisters[2].setValue(measurements.apparentPower);
        }
        if (measurements.frequency !== undefined) {
            this.frequencyRegister.setValue(measurements.frequency);
        }
        if (measurements.activeEnergyImport !== undefined) {
            this.energyRegisters[0].setValue(measurements.activeEnergyImport);
        }
        if (measurements.activeEnergyExport !== undefined) {
            this.energyRegisters[1].setValue(measurements.activeEnergyExport);
        }
        if (measurements.reactiveEnergyImport !== undefined) {
            this.energyRegisters[2].setValue(measurements.reactiveEnergyImport);
        }
        if (measurements.reactiveEnergyExport !== undefined) {
            this.energyRegisters[3].setValue(measurements.reactiveEnergyExport);
        }
    }
    /**
     * Increment a specific counter
     */
    incrementCounter(type) {
        const counterIndex = {
            'powerFailure': 0,
            'tamper': 1,
            'programming': 2,
            'billing': 3
        }[type];
        const currentValue = this.counters[counterIndex].getValue();
        this.counters[counterIndex].setValue(currentValue + 1);
    }
    /**
     * Capture current values
     */
    capture() {
        super.capture();
    }
}
exports.InstantaneousProfile = InstantaneousProfile;
