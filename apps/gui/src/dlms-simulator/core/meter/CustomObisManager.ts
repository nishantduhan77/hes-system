import { ObisCode } from '../dlms/ObisCode';
import { DataType } from '../dlms/DataType';
import { AccessRights } from '../dlms/AccessRights';

export class CustomObisManager {
    private static readonly CUSTOM_OBIS_CODES = {
        POWER_FAIL_EVENT: new ObisCode(1, 0, 99, 1, 0, 255),
        TAMPER_EVENT: new ObisCode(1, 0, 99, 2, 0, 255),
        MAGNETIC_TAMPER: new ObisCode(1, 0, 99, 2, 1, 255),
        TERMINAL_COVER_TAMPER: new ObisCode(1, 0, 99, 2, 2, 255),
        STRONG_DC_FIELD: new ObisCode(1, 0, 99, 2, 3, 255),
        REVERSE_CURRENT: new ObisCode(1, 0, 99, 2, 4, 255),
        LOW_BATTERY: new ObisCode(1, 0, 99, 3, 0, 255),
        PHASE_REVERSAL: new ObisCode(1, 0, 99, 4, 0, 255),
        NEUTRAL_DISCONNECT: new ObisCode(1, 0, 99, 5, 0, 255),
        METER_TEMPERATURE: new ObisCode(1, 0, 99, 6, 0, 255)
    };

    private values: Map<string, any> = new Map();
    private accessRights: Map<string, AccessRights> = new Map();

    constructor() {
        this.initializeDefaultValues();
        this.initializeAccessRights();
    }

    private initializeDefaultValues() {
        // Initialize all custom OBIS codes with default values
        Object.entries(CustomObisManager.CUSTOM_OBIS_CODES).forEach(([key, obisCode]) => {
            this.values.set(obisCode.toString(), this.getDefaultValue(key));
        });
    }

    private initializeAccessRights() {
        // Set default access rights for all custom OBIS codes
        Object.values(CustomObisManager.CUSTOM_OBIS_CODES).forEach(obisCode => {
            this.accessRights.set(obisCode.toString(), new AccessRights(true, true, true, true));
        });
    }

    private getDefaultValue(key: string): any {
        switch (key) {
            case 'POWER_FAIL_EVENT':
            case 'TAMPER_EVENT':
            case 'MAGNETIC_TAMPER':
            case 'TERMINAL_COVER_TAMPER':
            case 'STRONG_DC_FIELD':
            case 'REVERSE_CURRENT':
            case 'LOW_BATTERY':
            case 'PHASE_REVERSAL':
            case 'NEUTRAL_DISCONNECT':
                return 0;
            case 'METER_TEMPERATURE':
                return 25.0;
            default:
                return null;
        }
    }

    public getObisCode(key: keyof typeof CustomObisManager.CUSTOM_OBIS_CODES): ObisCode {
        return CustomObisManager.CUSTOM_OBIS_CODES[key];
    }

    public getValue(obisCode: ObisCode): any {
        return this.values.get(obisCode.toString());
    }

    public setValue(obisCode: ObisCode, value: any): void {
        this.values.set(obisCode.toString(), value);
    }

    public getAccessRights(obisCode: ObisCode): AccessRights {
        return this.accessRights.get(obisCode.toString()) || new AccessRights(false, false, false, false);
    }

    public setAccessRights(obisCode: ObisCode, rights: AccessRights): void {
        this.accessRights.set(obisCode.toString(), rights);
    }

    public getAllObisCodes(): ObisCode[] {
        return Object.values(CustomObisManager.CUSTOM_OBIS_CODES);
    }

    public getDataType(obisCode: ObisCode): DataType {
        switch (obisCode.toString()) {
            case CustomObisManager.CUSTOM_OBIS_CODES.METER_TEMPERATURE.toString():
                return DataType.FLOAT32;
            default:
                return DataType.UINT32;
        }
    }

    public reset(): void {
        this.values.clear();
        this.accessRights.clear();
        this.initializeDefaultValues();
        this.initializeAccessRights();
    }
} 