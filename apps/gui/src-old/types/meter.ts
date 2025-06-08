export interface MeterReading {
    meterId: string;
    timestamp: Date;
    readings: {
        voltage: number;
        current: number;
        power: number;
        frequency: number;
        energyConsumption: number;
    };
    status: {
        connectionStatus: 'CONNECTED' | 'DISCONNECTED';
        quality: 'GOOD' | 'QUESTIONABLE' | 'BAD';
    };
}

export interface MeterProfile {
    meterId: string;
    timestamp: Date;
    energy: number;
    power: number;
    voltage: number;
    current: number;
    frequency: number;
    powerFactor: number;
    quality: 'GOOD' | 'QUESTIONABLE' | 'BAD';
    status: {
        connected: boolean;
        lastCommunication: Date;
        firmware: string;
    };
}

export interface MeterEvent {
    meterId: string;
    timestamp: Date;
    type: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
    message: string;
    details?: {
        code: string;
        source: string;
        [key: string]: any;
    };
}

export interface MeterAlarm {
    meterId: string;
    timestamp: Date;
    type: string;
    severity: 'CRITICAL' | 'WARNING';
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED';
    message: string;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    clearedAt?: Date;
}

export interface MeterCommand {
    meterId: string;
    timestamp: Date;
    type: string;
    parameters: Record<string, any>;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'EXECUTED' | 'FAILED';
    response?: {
        timestamp: Date;
        status: string;
        data?: any;
        error?: string;
    };
}

export interface MeterConfiguration {
    meterId: string;
    protocol: 'DLMS' | 'MODBUS' | 'IEC62056';
    communicationType: 'DIRECT' | 'GATEWAY';
    ipAddress?: string;
    port?: number;
    credentials?: {
        username: string;
        password: string;
        authenticationMechanism: string;
    };
    readSchedule: {
        interval: number;
        startTime?: string;
        endTime?: string;
        priority: number;
    };
    thresholds: {
        voltage: {
            min: number;
            max: number;
        };
        current: {
            max: number;
        };
        power: {
            max: number;
        };
    };
}

export type DataGenerationRate = 'REAL_TIME' | 'FAST' | 'HISTORICAL'; 