import { ProfileGeneric } from './ProfileGeneric';
import { ObisCode } from '../obis/ObisCode';
import { Register } from './Register';
import { Unit } from '../data/Types';

interface CaptureObject {
    classId: number;
    logicalName: ObisCode;
    attributeIndex: number;
    dataIndex: number;
}

/**
 * OEM Codes for different manufacturers
 */
export enum OEMCode {
    SCHNEIDER = 'SC',
    ALLIED = 'AL'
}

/**
 * Name Plate Profile Class
 * OBIS Code: 0.0.94.91.10.255
 * 
 * Notes:
 * 1. Serial number format: 2 character Alpha part (OEM code) + 7/8 digits unique number sequence
 * 2. OEM codes are assigned by UPPCL for each manufacturer
 */
export class NamePlateProfile extends ProfileGeneric {
    // String storage for text values
    private stringValues: Map<string, string> = new Map();
    
    // Meter Identification - Using Register for numeric values and Map for strings
    private serialNumber: Register = new Register(ObisCode.fromString('0.0.96.1.0.255'), Unit.NONE, 0);
    private deviceId: Register = new Register(ObisCode.fromString('0.0.96.1.2.255'), Unit.NONE, 0);
    private manufacturerName: Register = new Register(ObisCode.fromString('0.0.96.1.1.255'), Unit.NONE, 0);
    private firmwareVersion: Register = new Register(ObisCode.fromString('1.0.0.2.0.255'), Unit.NONE, 0);
    
    // Meter Specifications
    private meterType: Register = new Register(ObisCode.fromString('0.0.94.91.9.255'), Unit.NONE, 0);
    private meterCategory: Register = new Register(ObisCode.fromString('0.0.94.91.11.255'), Unit.NONE, 0);
    private currentRating: Register = new Register(ObisCode.fromString('0.0.94.91.12.255'), Unit.NONE, 0);
    private yearOfManufacture: Register = new Register(ObisCode.fromString('0.0.96.1.4.255'), Unit.NONE, 0);
    
    // Transformer Ratios
    private ctr: Register = new Register(ObisCode.fromString('1.0.0.4.2.255'), Unit.NONE, 0);
    private ptr: Register = new Register(ObisCode.fromString('1.0.0.4.3.255'), Unit.NONE, 0);

    constructor() {
        const profileObisCode = ObisCode.fromString('0.0.94.91.10.255');
        super(profileObisCode, 1); // Only one entry needed for nameplate
        
        this.setupCaptureObjects();
    }

    private setupCaptureObjects(): void {
        // Add meter identification objects
        this.addCaptureObject({
            classId: this.serialNumber.getClassId(),
            logicalName: this.serialNumber.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: this.deviceId.getClassId(),
            logicalName: this.deviceId.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: this.manufacturerName.getClassId(),
            logicalName: this.manufacturerName.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: this.firmwareVersion.getClassId(),
            logicalName: this.firmwareVersion.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        // Add meter specification objects
        this.addCaptureObject({
            classId: this.meterType.getClassId(),
            logicalName: this.meterType.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: this.meterCategory.getClassId(),
            logicalName: this.meterCategory.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: this.currentRating.getClassId(),
            logicalName: this.currentRating.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: this.yearOfManufacture.getClassId(),
            logicalName: this.yearOfManufacture.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        // Add transformer ratio objects
        this.addCaptureObject({
            classId: this.ctr.getClassId(),
            logicalName: this.ctr.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });

        this.addCaptureObject({
            classId: this.ptr.getClassId(),
            logicalName: this.ptr.getLogicalName(),
            attributeIndex: 2,
            dataIndex: 0
        });
    }

    /**
     * Set meter identification details
     */
    public setMeterIdentification(params: {
        manufacturerCode: OEMCode,
        uniqueNumber: number,
        deviceId: string,
        manufacturerName: string,
        firmwareVersion: string
    }): void {
        // Format serial number according to specification (2 char OEM code + 7/8 digits)
        const serialNumber = `${params.manufacturerCode}${params.uniqueNumber.toString().padStart(8, '0')}`;
        
        // Store string values in the map
        this.stringValues.set('serialNumber', serialNumber);
        this.stringValues.set('deviceId', params.deviceId);
        this.stringValues.set('manufacturerName', params.manufacturerName);
        this.stringValues.set('firmwareVersion', params.firmwareVersion);
        
        // Store numeric hash values in registers for DLMS compatibility
        this.serialNumber.setValue(this.hashString(serialNumber));
        this.deviceId.setValue(this.hashString(params.deviceId));
        this.manufacturerName.setValue(this.hashString(params.manufacturerName));
        this.firmwareVersion.setValue(this.hashString(params.firmwareVersion));
    }

    /**
     * Set meter specifications
     */
    public setMeterSpecifications(params: {
        meterType: number,
        category: string,
        currentRating: string,
        yearOfManufacture: number
    }): void {
        this.meterType.setValue(params.meterType);
        this.stringValues.set('category', params.category);
        this.stringValues.set('currentRating', params.currentRating);
        this.meterCategory.setValue(this.hashString(params.category));
        this.currentRating.setValue(this.hashString(params.currentRating));
        this.yearOfManufacture.setValue(params.yearOfManufacture);
    }

    /**
     * Set transformer ratios
     */
    public setTransformerRatios(ctr: number, ptr: number): void {
        this.ctr.setValue(ctr);
        this.ptr.setValue(ptr);
    }

    /**
     * Get all nameplate details
     */
    public getNameplateDetails(): {
        serialNumber: string,
        deviceId: string,
        manufacturerName: string,
        firmwareVersion: string,
        meterType: number,
        category: string,
        currentRating: string,
        yearOfManufacture: number,
        ctr: number,
        ptr: number
    } {
        return {
            serialNumber: this.stringValues.get('serialNumber') || '',
            deviceId: this.stringValues.get('deviceId') || '',
            manufacturerName: this.stringValues.get('manufacturerName') || '',
            firmwareVersion: this.stringValues.get('firmwareVersion') || '',
            meterType: this.meterType.getValue(),
            category: this.stringValues.get('category') || '',
            currentRating: this.stringValues.get('currentRating') || '',
            yearOfManufacture: this.yearOfManufacture.getValue(),
            ctr: this.ctr.getValue(),
            ptr: this.ptr.getValue()
        };
    }

    /**
     * Validate serial number format
     */
    private validateSerialNumber(serialNumber: string): boolean {
        // Check if starts with valid OEM code
        const oemCode = serialNumber.substring(0, 2);
        if (!Object.values(OEMCode).includes(oemCode as OEMCode)) {
            return false;
        }

        // Check if followed by 7-8 digits
        const numericPart = serialNumber.substring(2);
        return /^\d{7,8}$/.test(numericPart);
    }

    /**
     * Create a numeric hash of a string for DLMS storage
     * This is a simple implementation - in production you might want a more sophisticated hashing method
     */
    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
} 