import { ProfileGeneric } from './ProfileGeneric';
import { ObisCode } from '../obis/ObisCode';
import { Register } from './Register';
import { Clock } from './Clock';
import { Unit } from '../data/Types';

/**
 * Error codes for Meter Health Indicator
 */
export enum MeterHealthError {
    NO_ERROR = 0,            // Err 00: No Error
    RTC_ERROR = 1,          // Err 01: RTC Error
    MEASUREMENT_ERROR = 2,   // Err 02: Measurement Error
    NVM_ERROR = 3,          // Err 03: NVM Error
    DISPLAY_ERROR = 4,      // Err 04: Display Error
    WATCHDOG_ERROR = 5,     // Err 05: Watchdog Error
    CALIBRATION_ERROR = 6,  // Err 06: Calibration Error
    FIRMWARE_ERROR = 7,     // Err 07: Firmware Error
    MEMORY_ERROR = 8,       // Err 08: Memory Error
    COMMUNICATION_ERROR = 9, // Err 09: Communication Error
    BATTERY_ERROR = 10,     // Err 10: Battery Error
    POWER_ERROR = 11,       // Err 11: Power Error
    TAMPER_ERROR = 12       // Err 12: Tamper Error
}

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
export class BlockLoadProfile extends ProfileGeneric {
    // Initialize properties with default values
    private rtcClock: Clock = new Clock(ObisCode.fromString('0.0.1.0.0.255'));
    private currentRegisters: Register[] = [];
    private voltageRegisters: Register[] = [];
    private energyRegisters: Register[] = [];
    private meterHealthIndicator: Register;
    private signalStrength: Register;

    constructor(captureInterval: number = 1800) { // Default 30 minutes in seconds
        const profileObisCode = ObisCode.fromString('1.0.99.1.0.255');
        // Calculate max entries based on capture interval
        const maxEntries = captureInterval === 1800 ? 
            2880 : // 90 days * 48 captures per day for 30 min interval
            4320;  // 45 days * 96 captures per day for 15 min interval
            
        super(profileObisCode, maxEntries);
        
        this.initializeRegisters();
        this.setupCaptureObjects();
        this.setCapturePeriod(captureInterval);
    }

    private initializeRegisters(): void {
        // Initialize Current Registers (IR, IY, IB) with scaler (-2)
        this.currentRegisters = [
            new Register(ObisCode.fromString('1.0.31.27.0.255'), Unit.AMPERE, -2),
            new Register(ObisCode.fromString('1.0.51.27.0.255'), Unit.AMPERE, -2),
            new Register(ObisCode.fromString('1.0.71.27.0.255'), Unit.AMPERE, -2)
        ];

        // Initialize Voltage Registers (VRN, VYN, VBN) with scaler (-1)
        this.voltageRegisters = [
            new Register(ObisCode.fromString('1.0.32.27.0.255'), Unit.VOLT, -1),
            new Register(ObisCode.fromString('1.0.52.27.0.255'), Unit.VOLT, -1),
            new Register(ObisCode.fromString('1.0.72.27.0.255'), Unit.VOLT, -1)
        ];

        // Initialize Energy Registers with scaler (0)
        this.energyRegisters = [
            new Register(ObisCode.fromString('1.0.1.29.0.255'), Unit.WATT_HOUR, 0),  // Wh Import
            new Register(ObisCode.fromString('1.0.9.29.0.255'), Unit.VOLT_AMPERE_HOUR, 0), // VAh Import
            new Register(ObisCode.fromString('1.0.2.29.0.255'), Unit.WATT_HOUR, 0),  // Wh Export
            new Register(ObisCode.fromString('1.0.10.29.0.255'), Unit.VOLT_AMPERE_HOUR, 0) // VAh Export
        ];

        // Initialize Meter Health Indicator
        this.meterHealthIndicator = new Register(ObisCode.fromString('0.0.96.10.1.255'), Unit.NONE, 0);

        // Initialize Signal Strength (RSSI)
        this.signalStrength = new Register(ObisCode.fromString('0.1.96.12.5.255'), Unit.NONE, 0);
    }

    private setupCaptureObjects(): void {
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
    public updateMeasurements(measurements: {
        currents?: number[],
        voltages?: number[],
        whImport?: number,
        whExport?: number,
        vahImport?: number,
        vahExport?: number,
        meterHealth?: MeterHealthError,
        signalStrength?: number
    }): void {
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
    public setMeterHealth(errorCode: MeterHealthError): void {
        if (errorCode < MeterHealthError.NO_ERROR || errorCode > MeterHealthError.TAMPER_ERROR) {
            throw new Error(`Invalid meter health error code: ${errorCode}. Must be between 0 and 12.`);
        }
        this.meterHealthIndicator.setValue(errorCode);
    }

    /**
     * Get meter health indicator error code
     * Returns error code (Err 00 to Err 12)
     */
    public getMeterHealthError(): MeterHealthError {
        return this.meterHealthIndicator.getValue() as MeterHealthError;
    }

    /**
     * Set signal strength (RSSI) with validation
     */
    public setSignalStrength(rssi: number): void {
        // Typical RSSI range is -120 dBm to 0 dBm
        if (rssi < -120 || rssi > 0) {
            throw new Error(`Invalid RSSI value: ${rssi}. Must be between -120 and 0 dBm.`);
        }
        this.signalStrength.setValue(rssi);
    }

    /**
     * Get signal strength (RSSI)
     */
    public getSignalStrength(): number {
        return this.signalStrength.getValue();
    }

    /**
     * Get error description for meter health code
     */
    public getMeterHealthDescription(errorCode: MeterHealthError): string {
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
    public capture(): void {
        super.capture();
    }
} 