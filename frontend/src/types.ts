export interface Meter {
    meter_id: string;
    meter_code: string;
    serial_number: string;
    manufacturer: string;
    model: string;
    meter_type: string;
    location: string;
    status: string;
    last_communication: string;
}

export interface MeterReading {
    reading_id: string;
    timestamp: string;
    active_power_import: number;
    active_power_export: number;
    voltage_r_phase: number;
    current_r_phase: number;
}

export interface LatestReading {
    meter_code: string;
    location: string;
    timestamp: string;
    active_power_import: number;
    active_power_export: number;
    voltage_r_phase: number;
    current_r_phase: number;
} 