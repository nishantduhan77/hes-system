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
 * Billing Status Word Bits
 */
export enum BillingStatus {
    NORMAL = 0x0000,
    POWER_FAIL = 0x0001,
    TIME_CHANGED = 0x0002,
    BILLING_RESET = 0x0004,
    MD_RESET = 0x0008,
    PROGRAM_MODE = 0x0010,
    CONFIGURATION_CHANGED = 0x0020,
    FIRMWARE_UPGRADED = 0x0040,
    TAMPER_DETECTED = 0x0080,
    BATTERY_LOW = 0x0100,
    MEMORY_ERROR = 0x0200,
    COMMUNICATION_ERROR = 0x0400,
    CLOCK_INVALID = 0x0800
}

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
export class BillingProfile extends ProfileGeneric {
    // Initialize properties with default values
    private billingDate: Clock = new Clock(ObisCode.fromString('0.0.1.2.255'));
    private systemPowerFactor: Register = new Register(ObisCode.fromString('1.0.13.0.0.255'), Unit.NONE, 0);
    
    // Energy Import Registers
    private whImportRegisters: Register[] = [];
    private vahImportRegisters: Register[] = [];
    
    // Maximum Demand Registers
    private mdWImportRegisters: Register[] = [];
    private mdWImportTimeRegisters: Register[] = [];
    private mdVAImportRegisters: Register[] = [];
    private mdVAImportTimeRegisters: Register[] = [];
    
    // Additional Registers
    private billingPowerOnDuration: Register = new Register(ObisCode.fromString('0.0.94.91.13.255'), Unit.NONE, 0);
    private whExport: Register = new Register(ObisCode.fromString('1.0.2.8.0.255'), Unit.WATT_HOUR, 0);
    private varhRegisters: Register[] = [];

    // Constants
    private static readonly MAX_ENTRIES = 13; // 12 last bills + 1 current bill
    private static readonly MAX_TARIFF_ZONES = 8; // TZ1-TZ8

    // Billing Status
    private billingStatusWord: number = BillingStatus.NORMAL;
    private billingResetCount: number = 0;
    private lastResetDateTime: Register = new Register(ObisCode.fromString('0.0.1.2.0.255'), Unit.NONE, 0);

    constructor() {
        const profileObisCode = ObisCode.fromString('1.0.98.1.0.255');
        super(profileObisCode, BillingProfile.MAX_ENTRIES);
        
        this.initializeRegisters();
        this.setupCaptureObjects();
    }

    private initializeRegisters(): void {
        // Initialize Wh Import Registers for each tariff zone
        for (let i = 1; i <= BillingProfile.MAX_TARIFF_ZONES; i++) {
            this.whImportRegisters.push(
                new Register(ObisCode.fromString(`1.0.1.8.${i}.255`), Unit.WATT_HOUR, 0)
            );
        }

        // Initialize VAh Import Registers for each tariff zone
        for (let i = 1; i <= BillingProfile.MAX_TARIFF_ZONES; i++) {
            this.vahImportRegisters.push(
                new Register(ObisCode.fromString(`1.0.9.8.${i}.255`), Unit.VOLT_AMPERE_HOUR, 0)
            );
        }

        // Initialize MD W Import Registers and their time registers
        for (let i = 1; i <= BillingProfile.MAX_TARIFF_ZONES; i++) {
            this.mdWImportRegisters.push(
                new Register(ObisCode.fromString(`1.0.1.6.${i}.255`), Unit.WATT, 0)
            );
            this.mdWImportTimeRegisters.push(
                new Register(ObisCode.fromString(`1.0.1.6.${i}.255`), Unit.NONE, 0)
            );
        }

        // Initialize MD VA Import Registers and their time registers
        for (let i = 1; i <= BillingProfile.MAX_TARIFF_ZONES; i++) {
            this.mdVAImportRegisters.push(
                new Register(ObisCode.fromString(`1.0.9.6.${i}.255`), Unit.VOLT_AMPERE, 0)
            );
            this.mdVAImportTimeRegisters.push(
                new Register(ObisCode.fromString(`1.0.9.6.${i}.255`), Unit.NONE, 0)
            );
        }

        // Initialize VArh Registers (Q1-Q4)
        const varhObis = ['1.0.5.8.0.255', '1.0.6.8.0.255', '1.0.7.8.0.255', '1.0.8.8.0.255'];
        varhObis.forEach(obis => {
            this.varhRegisters.push(
                new Register(ObisCode.fromString(obis), Unit.VAR_HOUR, 0)
            );
        });
    }

    private setupCaptureObjects(): void {
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
            logicalName: ObisCode.fromString('0.0.96.10.1.255'), // Billing status
            attributeIndex: 2,
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: 3, // Register class
            logicalName: ObisCode.fromString('0.0.96.15.0.255'), // Reset count
            attributeIndex: 2,
            dataIndex: 0
        });
    }

    /**
     * Update billing measurements
     */
    public updateMeasurements(measurements: {
        systemPowerFactor?: number,
        whImport?: number[],
        vahImport?: number[],
        mdWImport?: number[],
        mdWImportTime?: Date[],
        mdVAImport?: number[],
        mdVAImportTime?: Date[],
        powerOnDuration?: number,
        whExport?: number,
        varhQ1?: number,
        varhQ2?: number,
        varhQ3?: number,
        varhQ4?: number
    }): void {
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
    public async resetBilling(): Promise<void> {
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
    public getBillingValues(): {
        systemPowerFactor: number,
        whImport: number[],
        vahImport: number[],
        mdWImport: number[],
        mdWImportTime: number[],
        mdVAImport: number[],
        mdVAImportTime: number[],
        powerOnDuration: number,
        whExport: number,
        varhValues: number[],
        billingStatus: number,
        resetCount: number,
        lastResetTime: number
    } {
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
    public updateBillingStatus(status: BillingStatus): void {
        this.billingStatusWord |= status;
    }

    /**
     * Clear billing status bits
     */
    public clearBillingStatus(status: BillingStatus): void {
        this.billingStatusWord &= ~status;
    }

    /**
     * Get current billing status
     */
    public getBillingStatus(): number {
        return this.billingStatusWord;
    }

    /**
     * Get billing reset count
     */
    public getBillingResetCount(): number {
        return this.billingResetCount;
    }

    /**
     * Get last reset time
     */
    public getLastResetTime(): number {
        return this.lastResetDateTime.getValue();
    }

    /**
     * Validate billing date
     */
    public validateBillingDate(date: Date): boolean {
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
    public override capture(): void {
        // Add billing status to capture objects if not already present
        const captureObjects = this.getAttribute(3).getValue() as CaptureObject[];
        const hasBillingStatus = captureObjects.some((obj: CaptureObject) => 
            obj.logicalName.toString() === '0.0.96.10.1.255'
        );

        if (!hasBillingStatus) {
            this.addCaptureObject({
                classId: 3,
                logicalName: ObisCode.fromString('0.0.96.10.1.255'),
                attributeIndex: 2,
                dataIndex: 0
            });
        }

        super.capture();
    }
} 