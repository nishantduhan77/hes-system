import { ProfileGeneric } from './ProfileGeneric';
import { ObisCode } from '../obis/ObisCode';
import { Register } from './Register';
import { Clock } from './Clock';
import { Unit } from '../data/Types';

interface CaptureObject {
    classId: number;
    logicalName: ObisCode;
    attributeIndex: number;
    dataIndex: number;
}

/**
 * Event Types for different categories of events
 */
export enum EventType {
    // Voltage Related Events
    VOLTAGE_MISSING = 1,
    VOLTAGE_UNBALANCE = 2,
    VOLTAGE_HIGH = 3,
    VOLTAGE_LOW = 4,
    VOLTAGE_SWELL = 5,
    VOLTAGE_SAG_DIP = 6,
    OVER_VOLTAGE = 7,
    LOW_VOLTAGE = 8,
    VOLTAGE_UNBALANCE_OCCURRENCE = 9,
    VOLTAGE_UNBALANCE_RESTORATION = 10,
    PHASE_SEQUENCE_REVERSAL_OCCURRENCE = 11,
    PHASE_SEQUENCE_REVERSAL_RESTORATION = 12,

    // Current Related Events
    CURRENT_MISSING = 51,
    CURRENT_UNBALANCE = 52,
    CURRENT_REVERSAL = 53,
    CT_OPEN = 54,
    CT_REVERSAL = 55,
    CT_SHORT = 56,
    CURRENT_BYPASS = 57,
    OVER_CURRENT = 58,
    HIGH_NEUTRAL_CURRENT = 59,

    // Power Related Events
    POWER_FAILURE = 101,
    POWER_RESTORATION = 102,

    // Transaction Events
    PF_RATIO_CHANGE = 125,
    CT_PT_RATIO_CHANGE = 126,
    VT_CONNECTION_CHANGE = 127,
    REAL_TIME_CLOCK = 131,
    DEMAND_INTEGRATION_PERIOD = 132,
    PROFILE_CAPTURE_PERIOD = 133,
    SINGLE_ACTION_SCHEDULE = 134,
    BILLING_DATE = 135,
    ACTIVITY_CALENDAR = 136,
    TOU_CHANGE = 141,
    MD_RESET = 142,
    IMAGE_ACTIVATION = 151,
    GLOBAL_KEY_CHANGE = 164,
    FIRMWARE_UPGRADE = 165,

    // Other Events
    PERMANENT_MAGNET = 201,
    NEUTRAL_DISTURBANCE = 203,
    COMMUNICATION_DISTURBANCE = 210,
    OVERLOAD = 211,
    TEMPERATURE_RISE = 889,
    WRONG_PHASE_ASSOCIATION = 888,
    PHASE_ASSOCIATION_RESTORATION = 889,
    ENERGY_MISMATCH = 890,
    COVER_OPEN = 901
}

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
export class TamperEventsProfile extends ProfileGeneric {
    // Event Log Objects
    private eventDateTime: Clock = new Clock(ObisCode.fromString('0.0.1.0.0.255'));
    private eventCode: Register = new Register(ObisCode.fromString('0.0.96.11.0.255'), Unit.NONE, 0);
    
    // Electrical Parameters at Event Time
    private currentRegisters: Register[] = [];
    private voltageRegisters: Register[] = [];
    private powerFactorRegister: Register = new Register(ObisCode.fromString('1.0.13.7.0.255'), Unit.NONE, 0);
    private activePowerRegister: Register = new Register(ObisCode.fromString('1.0.1.7.0.255'), Unit.WATT, 0);
    private apparentPowerRegister: Register = new Register(ObisCode.fromString('1.0.9.7.0.255'), Unit.VOLT_AMPERE, 0);
    
    // Energy Values at Event Time
    private whImportRegister: Register = new Register(ObisCode.fromString('1.0.1.8.0.255'), Unit.WATT_HOUR, 0);
    private whExportRegister: Register = new Register(ObisCode.fromString('1.0.2.8.0.255'), Unit.WATT_HOUR, 0);
    
    // Event Sequence Number
    private sequenceNumber: Register = new Register(ObisCode.fromString('0.0.96.11.0.255'), Unit.NONE, 0);

    constructor() {
        const profileObisCode = ObisCode.fromString('0.0.99.98.0.255');
        // Using 150 as max entries (voltage events limit, which is highest)
        super(profileObisCode, 150);
        
        this.initializeRegisters();
        this.setupCaptureObjects();
    }

    private initializeRegisters(): void {
        // Initialize Current Registers (IR, IY, IB)
        const currentObis = ['1.0.31.7.0.255', '1.0.51.7.0.255', '1.0.71.7.0.255'];
        currentObis.forEach(obis => {
            this.currentRegisters.push(
                new Register(ObisCode.fromString(obis), Unit.AMPERE, -2)  // Scaler -2 as per spec
            );
        });

        // Initialize Voltage Registers (VR, VY, VB)
        const voltageObis = ['1.0.32.7.0.255', '1.0.52.7.0.255', '1.0.72.7.0.255'];
        voltageObis.forEach(obis => {
            this.voltageRegisters.push(
                new Register(ObisCode.fromString(obis), Unit.VOLT, -1)  // Scaler -1 as per spec
            );
        });
    }

    private setupCaptureObjects(): void {
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
    public recordEvent(eventType: EventType, measurements: {
        currents?: number[],  // [IR, IY, IB]
        voltages?: number[],  // [VR, VY, VB]
        powerFactor?: number,
        activePower?: number,
        apparentPower?: number,
        whImport?: number,
        whExport?: number
    }): void {
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
    public getLatestEventDetails(): {
        eventType: EventType,
        timestamp: Date,
        sequenceNumber: number,
        currents: number[],
        voltages: number[],
        powerFactor: number,
        activePower: number,
        apparentPower: number,
        whImport: number,
        whExport: number
    } {
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