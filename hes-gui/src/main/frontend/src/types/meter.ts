export interface Meter {
  id: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  installationDate: string;
  firmwareVersion: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastCommunication: string;
  ipAddress?: string;
  port?: number;
  relayStatus: 'ON' | 'OFF';
}

export interface MeterReading {
  id: string;
  meterId: string;
  timestamp: string;
  value: number;
  unit: string;
  status: 'VALID' | 'INVALID';
  obisCode?: string;
  phase?: 'R' | 'Y' | 'B';
}

export interface SystemEvent {
  id: string;
  meterId: string;
  type: 'CONNECT' | 'DISCONNECT' | 'ERROR' | 'WARNING';
  timestamp: string;
  description: string;
}

export interface SystemStatus {
  status: string;
  uptime: string;
  lastBackup: string;
  activeConnections: number;
  totalMeters: number;
  systemLoad: number;
  memoryUsage: number;
}

export interface BillingData {
  id: string;
  meterId: string;
  startDate: string;
  endDate: string;
  consumption: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

export interface IndianObisCode {
  code: string;
  description: string;
  unit: string;
  category: 'INSTANTANEOUS' | 'BLOCK_LOAD' | 'DAILY_LOAD' | 'BILLING' | 'EVENT';
}

export interface MeterEvent {
  id: string;
  meterId: string;
  timestamp: string;
  eventCode: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'CLEARED';
  clearTime?: string;
}

export const INDIAN_OBIS_CODES: Record<string, IndianObisCode> = {
  '1.0.1.7.0.255': {
    code: '1.0.1.7.0.255',
    description: 'Active Power Import',
    unit: 'kW',
    category: 'INSTANTANEOUS'
  },
  '1.0.2.7.0.255': {
    code: '1.0.2.7.0.255',
    description: 'Active Power Export',
    unit: 'kW',
    category: 'INSTANTANEOUS'
  },
  '1.0.12.7.0.255': {
    code: '1.0.12.7.0.255',
    description: 'Voltage R-Phase',
    unit: 'V',
    category: 'INSTANTANEOUS'
  },
  '1.0.32.7.0.255': {
    code: '1.0.32.7.0.255',
    description: 'Current R-Phase',
    unit: 'A',
    category: 'INSTANTANEOUS'
  },
  '0.0.96.11.0.255': {
    code: '0.0.96.11.0.255',
    description: 'Event Code',
    unit: '',
    category: 'EVENT'
  }
}; 