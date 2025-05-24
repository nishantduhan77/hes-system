export interface Meter {
  id: number;
  meterId: string;
  serialNumber: string;
  manufacturer: string;
  ipAddress: string;
  port: number;
  status: 'Connected' | 'Disconnected' | 'Error';
  lastCommunication: string | null;
}

export interface MeterReading {
  id: number;
  meterId: string;
  timestamp: string;
  voltage: number;
  current: number;
  frequency: number;
  activePowerImport: number;
  activePowerExport: number;
  reactivePowerImport: number;
  reactivePowerExport: number;
  powerFactor: number;
}

export interface MeterEvent {
  id: number;
  meterId: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface SystemStatus {
  status: 'Healthy' | 'Warning' | 'Error';
  uptime: string;
  totalMeters: number;
  connectedMeters: number;
  activeAlerts: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkThroughput: number;
  meterPollingRate: number;
}

export interface NewMeterForm {
  meterId: string;
  serialNumber: string;
  manufacturer: string;
  ipAddress: string;
  port: string;
} 