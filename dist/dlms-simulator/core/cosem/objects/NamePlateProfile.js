"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NamePlateProfile = exports.OEMCode = void 0;
const ProfileGeneric_1 = require("./ProfileGeneric");
const ObisCode_1 = require("../obis/ObisCode");
const Register_1 = require("./Register");
const Types_1 = require("../data/Types");
/**
 * OEM Codes for different manufacturers
 */
var OEMCode;
(function (OEMCode) {
    OEMCode["SCHNEIDER"] = "SC";
    OEMCode["ALLIED"] = "AL";
})(OEMCode || (exports.OEMCode = OEMCode = {}));
/**
 * Name Plate Profile Class
 * OBIS Code: 0.0.94.91.10.255
 *
 * Notes:
 * 1. Serial number format: 2 character Alpha part (OEM code) + 7/8 digits unique number sequence
 * 2. OEM codes are assigned by UPPCL for each manufacturer
 */
class NamePlateProfile extends ProfileGeneric_1.ProfileGeneric {
    constructor() {
        const profileObisCode = ObisCode_1.ObisCode.fromString('0.0.94.91.10.255');
        super(profileObisCode, 1); // Only one entry needed for nameplate
        // String storage for text values
        this.stringValues = new Map();
        // Meter Identification - Using Register for numeric values and Map for strings
        this.serialNumber = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.96.1.0.255'), Types_1.Unit.NONE, 0);
        this.deviceId = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.96.1.2.255'), Types_1.Unit.NONE, 0);
        this.manufacturerName = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.96.1.1.255'), Types_1.Unit.NONE, 0);
        this.firmwareVersion = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.0.2.0.255'), Types_1.Unit.NONE, 0);
        // Meter Specifications
        this.meterType = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.94.91.9.255'), Types_1.Unit.NONE, 0);
        this.meterCategory = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.94.91.11.255'), Types_1.Unit.NONE, 0);
        this.currentRating = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.94.91.12.255'), Types_1.Unit.NONE, 0);
        this.yearOfManufacture = new Register_1.Register(ObisCode_1.ObisCode.fromString('0.0.96.1.4.255'), Types_1.Unit.NONE, 0);
        // Transformer Ratios
        this.ctr = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.0.4.2.255'), Types_1.Unit.NONE, 0);
        this.ptr = new Register_1.Register(ObisCode_1.ObisCode.fromString('1.0.0.4.3.255'), Types_1.Unit.NONE, 0);
        this.setupCaptureObjects();
    }
    setupCaptureObjects() {
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
    setMeterIdentification(params) {
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
    setMeterSpecifications(params) {
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
    setTransformerRatios(ctr, ptr) {
        this.ctr.setValue(ctr);
        this.ptr.setValue(ptr);
    }
    /**
     * Get all nameplate details
     */
    getNameplateDetails() {
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
    validateSerialNumber(serialNumber) {
        // Check if starts with valid OEM code
        const oemCode = serialNumber.substring(0, 2);
        if (!Object.values(OEMCode).includes(oemCode)) {
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
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
}
exports.NamePlateProfile = NamePlateProfile;
