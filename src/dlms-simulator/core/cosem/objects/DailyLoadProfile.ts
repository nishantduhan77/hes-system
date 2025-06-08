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
 * Daily Load Profile Class
 * OBIS Code: 1.0.99.2.0.255
 * 
 * Notes:
 * 1. Import registers behave as forwarded registers when metering mode configured forwarded only mode
 * 2. Daily load profile data rollover after 90 days
 * 3. Time should be in HH:MM:SS format for any data/command
 * 4. Capture at midnight, it is not programmable (86400 seconds for a day)
 */
export class DailyLoadProfile extends ProfileGeneric {
    // Initialize properties with default values
    private rtcClock: Clock = new Clock(ObisCode.fromString('0.0.1.0.0.255'));
    private energyRegisters: Register[] = [];
    private maxDemandRegister: Register = new Register(ObisCode.fromString('1.0.1.6.0.255'), Unit.WATT, 0);
    private maxDemandTime: Register = new Register(ObisCode.fromString('1.0.1.6.0.255'), Unit.NONE, 0);

    // Constants
    private static readonly CAPTURE_PERIOD = 86400; // 24 hours in seconds
    private static readonly MAX_ENTRIES = 90; // 90 days of data

    constructor() {
        const profileObisCode = ObisCode.fromString('1.0.99.2.0.255');
        super(profileObisCode, DailyLoadProfile.MAX_ENTRIES);
        
        this.initializeRegisters();
        this.setupCaptureObjects();
    }

    private initializeRegisters(): void {
        // Initialize Energy Registers with scaler (0)
        this.energyRegisters = [
            // Basic Energy Measurements
            new Register(ObisCode.fromString('1.0.1.8.0.255'), Unit.WATT_HOUR, 0),    // Cum Energy - Wh Import
            new Register(ObisCode.fromString('1.0.2.8.0.255'), Unit.WATT_HOUR, 0),    // Cum Energy - Wh Export
            new Register(ObisCode.fromString('1.0.9.8.0.255'), Unit.VOLT_AMPERE_HOUR, 0),  // Cum Energy - VAh Import
            new Register(ObisCode.fromString('1.0.10.8.0.255'), Unit.VOLT_AMPERE_HOUR, 0), // Cum Energy - VAh Export

            // Quadrant-wise VAh Measurements
            new Register(ObisCode.fromString('1.0.5.8.0.255'), Unit.VOLT_AMPERE_HOUR, 0),  // Cum Energy - VArh Q1
            new Register(ObisCode.fromString('1.0.6.8.0.255'), Unit.VOLT_AMPERE_HOUR, 0),  // Cum Energy - VArh Q2
            new Register(ObisCode.fromString('1.0.7.8.0.255'), Unit.VOLT_AMPERE_HOUR, 0),  // Cum Energy - VArh Q3
            new Register(ObisCode.fromString('1.0.8.8.0.255'), Unit.VOLT_AMPERE_HOUR, 0)   // Cum Energy - VArh Q4
        ];
    }

    private setupCaptureObjects(): void {
        // Add RTC as first capture object
        this.addCaptureObject({
            classId: this.rtcClock.getClassId(),
            logicalName: this.rtcClock.getLogicalName(),
            attributeIndex: 2,  // Time attribute
            dataIndex: 0
        });

        // Add all energy registers as capture objects
        this.energyRegisters.forEach(reg => {
            this.addCaptureObject({
                classId: reg.getClassId(),
                logicalName: reg.getLogicalName(),
                attributeIndex: 2,  // Value attribute
                dataIndex: 0
            });
        });

        // Add maximum demand registers
        this.addCaptureObject({
            classId: this.maxDemandRegister.getClassId(),
            logicalName: this.maxDemandRegister.getLogicalName(),
            attributeIndex: 2,  // Value attribute
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: this.maxDemandTime.getClassId(),
            logicalName: this.maxDemandTime.getLogicalName(),
            attributeIndex: 2,  // Value attribute
            dataIndex: 0
        });
    }

    /**
     * Update profile measurements
     */
    public updateMeasurements(measurements: {
        whImport?: number,
        whExport?: number,
        vahImport?: number,
        vahExport?: number,
        varhQ1?: number,
        varhQ2?: number,
        varhQ3?: number,
        varhQ4?: number,
        maxDemand?: number,
        maxDemandTime?: Date
    }): void {
        if (measurements.whImport !== undefined) {
            this.energyRegisters[0].setValue(measurements.whImport);
        }

        if (measurements.whExport !== undefined) {
            this.energyRegisters[1].setValue(measurements.whExport);
        }

        if (measurements.vahImport !== undefined) {
            this.energyRegisters[2].setValue(measurements.vahImport);
        }

        if (measurements.vahExport !== undefined) {
            this.energyRegisters[3].setValue(measurements.vahExport);
        }

        if (measurements.varhQ1 !== undefined) {
            this.energyRegisters[4].setValue(measurements.varhQ1);
        }

        if (measurements.varhQ2 !== undefined) {
            this.energyRegisters[5].setValue(measurements.varhQ2);
        }

        if (measurements.varhQ3 !== undefined) {
            this.energyRegisters[6].setValue(measurements.varhQ3);
        }

        if (measurements.varhQ4 !== undefined) {
            this.energyRegisters[7].setValue(measurements.varhQ4);
        }

        if (measurements.maxDemand !== undefined) {
            this.maxDemandRegister.setValue(measurements.maxDemand);
        }

        if (measurements.maxDemandTime !== undefined) {
            // Convert Date to number (Unix timestamp in milliseconds)
            this.maxDemandTime.setValue(measurements.maxDemandTime.getTime());
        }
    }

    /**
     * Get capture period (always returns 86400 seconds - 24 hours)
     */
    public getCapturePeriod(): number {
        return DailyLoadProfile.CAPTURE_PERIOD;
    }

    /**
     * Get maximum number of entries (90 days)
     */
    public getMaxEntries(): number {
        return DailyLoadProfile.MAX_ENTRIES;
    }

    /**
     * Capture current values
     * Note: This should be called at midnight
     */
    public capture(): void {
        const now = new Date();
        if (now.getHours() !== 0 || now.getMinutes() !== 0) {
            console.warn('Daily Load Profile capture called outside midnight hour');
        }
        super.capture();
    }

    /**
     * Get all energy values
     */
    public getEnergyValues(): {
        whImport: number,
        whExport: number,
        vahImport: number,
        vahExport: number,
        varhQ1: number,
        varhQ2: number,
        varhQ3: number,
        varhQ4: number
    } {
        return {
            whImport: this.energyRegisters[0].getValue(),
            whExport: this.energyRegisters[1].getValue(),
            vahImport: this.energyRegisters[2].getValue(),
            vahExport: this.energyRegisters[3].getValue(),
            varhQ1: this.energyRegisters[4].getValue(),
            varhQ2: this.energyRegisters[5].getValue(),
            varhQ3: this.energyRegisters[6].getValue(),
            varhQ4: this.energyRegisters[7].getValue()
        };
    }

    /**
     * Get maximum demand information
     */
    public getMaxDemandInfo(): {
        value: number,
        timestamp: number
    } {
        return {
            value: this.maxDemandRegister.getValue(),
            timestamp: this.maxDemandTime.getValue()
        };
    }
} 