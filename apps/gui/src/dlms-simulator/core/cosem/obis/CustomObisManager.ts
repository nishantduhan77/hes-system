import { ObisCode } from './ObisCode';

export interface CustomObisDefinition {
    obisCode: string;
    name: string;
    description: string;
    dataType: string;
    unit?: string;
    access: 'read' | 'write' | 'read-write';
}

export class CustomObisManager {
    private static readonly CUSTOM_OBIS_CODES: CustomObisDefinition[] = [
        {
            obisCode: '1.0.101.0.0.255',
            name: 'Power Fail Event',
            description: 'Records power failure events with timestamp and duration',
            dataType: 'structure',
            access: 'read'
        },
        {
            obisCode: '1.0.102.0.0.255',
            name: 'Tamper Event',
            description: 'Records tamper detection events with type and timestamp',
            dataType: 'structure',
            access: 'read'
        },
        {
            obisCode: '1.0.103.0.0.255',
            name: 'Load Profile Status',
            description: 'Current status of load profile recording',
            dataType: 'enum',
            access: 'read-write'
        },
        {
            obisCode: '1.0.104.0.0.255',
            name: 'Billing Status',
            description: 'Current billing cycle status and last billing date',
            dataType: 'structure',
            access: 'read'
        },
        {
            obisCode: '1.0.105.0.0.255',
            name: 'Communication Status',
            description: 'Current communication status and last successful connection',
            dataType: 'structure',
            access: 'read'
        },
        {
            obisCode: '1.0.106.0.0.255',
            name: 'Firmware Version',
            description: 'Current firmware version and last update timestamp',
            dataType: 'structure',
            access: 'read'
        },
        {
            obisCode: '1.0.107.0.0.255',
            name: 'Meter Health Status',
            description: 'Overall meter health status and diagnostic information',
            dataType: 'structure',
            access: 'read'
        },
        {
            obisCode: '1.0.108.0.0.255',
            name: 'Tariff Configuration',
            description: 'Current tariff configuration and schedule',
            dataType: 'structure',
            access: 'read-write'
        },
        {
            obisCode: '1.0.109.0.0.255',
            name: 'Alarm Configuration',
            description: 'Alarm thresholds and notification settings',
            dataType: 'structure',
            access: 'read-write'
        },
        {
            obisCode: '1.0.110.0.0.255',
            name: 'Meter Configuration',
            description: 'General meter configuration parameters',
            dataType: 'structure',
            access: 'read-write'
        }
    ];

    private customObjects: Map<string, any>;

    constructor() {
        this.customObjects = new Map();
        this.initializeCustomObjects();
    }

    private initializeCustomObjects(): void {
        CustomObisManager.CUSTOM_OBIS_CODES.forEach(def => {
            this.customObjects.set(def.obisCode, {
                value: null,
                definition: def,
                lastUpdate: new Date()
            });
        });
    }

    /**
     * Get all custom OBIS code definitions
     */
    public getAllDefinitions(): CustomObisDefinition[] {
        return [...CustomObisManager.CUSTOM_OBIS_CODES];
    }

    /**
     * Get value for a custom OBIS code
     */
    public getValue(obisCode: string): any {
        const obj = this.customObjects.get(obisCode);
        return obj ? obj.value : null;
    }

    /**
     * Set value for a custom OBIS code
     */
    public setValue(obisCode: string, value: any): boolean {
        const obj = this.customObjects.get(obisCode);
        if (obj && obj.definition.access !== 'read') {
            obj.value = value;
            obj.lastUpdate = new Date();
            return true;
        }
        return false;
    }

    /**
     * Get definition for a custom OBIS code
     */
    public getDefinition(obisCode: string): CustomObisDefinition | undefined {
        return CustomObisManager.CUSTOM_OBIS_CODES.find(def => def.obisCode === obisCode);
    }

    /**
     * Check if an OBIS code is custom
     */
    public isCustomObis(obisCode: string): boolean {
        return this.customObjects.has(obisCode);
    }

    /**
     * Get last update time for a custom OBIS code
     */
    public getLastUpdate(obisCode: string): Date | undefined {
        const obj = this.customObjects.get(obisCode);
        return obj ? obj.lastUpdate : undefined;
    }

    /**
     * Reset all custom objects to their initial state
     */
    public reset(): void {
        this.initializeCustomObjects();
    }
} 