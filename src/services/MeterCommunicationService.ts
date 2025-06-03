import axios from 'axios';
import MeterEventService, { INDIAN_EVENT_CODES } from './MeterEventService';

export interface MeterConnection {
  meterId: string;
  ipAddress: string;
  port: number;
  status: 'CONNECTED' | 'DISCONNECTED';
  lastCommunication: string;
  relayStatus?: 'ON' | 'OFF';
  lastPingResponse?: number; // in milliseconds
}

class MeterCommunicationService {
  private static instance: MeterCommunicationService;
  private baseUrl: string;
  private connections: Map<string, MeterConnection> = new Map();
  private eventService: MeterEventService;

  private constructor() {
    this.baseUrl = 'http://localhost:8080/api';
    this.eventService = MeterEventService.getInstance();
  }

  public static getInstance(): MeterCommunicationService {
    if (!MeterCommunicationService.instance) {
      MeterCommunicationService.instance = new MeterCommunicationService();
    }
    return MeterCommunicationService.instance;
  }

  public async connect(meterId: string, ipAddress: string, port: number): Promise<void> {
    // In development mode, just simulate the connection
    const connection: MeterConnection = {
      meterId,
      ipAddress,
      port,
      status: 'CONNECTED',
      lastCommunication: new Date().toISOString(),
      relayStatus: 'ON' // Default relay status
    };
    this.connections.set(meterId, connection);
  }

  public async disconnect(meterId: string): Promise<void> {
    const connection = this.connections.get(meterId);
    if (connection) {
      connection.status = 'DISCONNECTED';
      this.connections.set(meterId, connection);
    }
  }

  public async readMeterData(meterId: string, obisCodes: string[]): Promise<Record<string, number>> {
    const connection = this.connections.get(meterId);
    if (!connection || connection.status !== 'CONNECTED') {
      throw new Error('Meter is not connected');
    }

    // In development mode, return mock data
    const result: Record<string, number> = {};
    obisCodes.forEach(code => {
      result[code] = Math.random() * 100;
    });

    connection.lastCommunication = new Date().toISOString();
    this.connections.set(meterId, connection);

    return result;
  }

  // New method to control relay
  public async controlRelay(meterId: string, action: 'ON' | 'OFF'): Promise<void> {
    const connection = this.connections.get(meterId);
    if (!connection || connection.status !== 'CONNECTED') {
      throw new Error('Meter is not connected');
    }

    // In development mode, simulate relay control
    connection.relayStatus = action;
    connection.lastCommunication = new Date().toISOString();
    this.connections.set(meterId, connection);

    // Create an event for relay control
    await this.eventService.createEvent({
      meterId,
      eventType: 'RELAY_CONTROL',
      eventCode: action === 'ON' ? '0x00050000' : '0x00050001',
      description: `Relay turned ${action}`,
      severity: 'MEDIUM'
    });
  }

  // New method to get relay status
  public async getRelayStatus(meterId: string): Promise<'ON' | 'OFF'> {
    const connection = this.connections.get(meterId);
    if (!connection || connection.status !== 'CONNECTED') {
      throw new Error('Meter is not connected');
    }
    return connection.relayStatus || 'OFF';
  }

  // New method to ping meter
  public async pingMeter(meterId: string): Promise<number> {
    const connection = this.connections.get(meterId);
    if (!connection || connection.status !== 'CONNECTED') {
      throw new Error('Meter is not connected');
    }

    // In development mode, simulate ping response time (20-200ms)
    const responseTime = Math.floor(Math.random() * 180) + 20;
    connection.lastPingResponse = responseTime;
    connection.lastCommunication = new Date().toISOString();
    this.connections.set(meterId, connection);

    return responseTime;
  }

  private async startPowerMonitoring(meterId: string) {
    // Monitor power status every 30 seconds
    setInterval(async () => {
      try {
        const connection = this.connections.get(meterId);
        if (!connection || connection.status !== 'CONNECTED') {
          return;
        }

        // Check power status through voltage readings
        const data = await this.readMeterData(meterId, [
          '1.0.32.7.0.255', // R Phase voltage
          '1.0.52.7.0.255', // Y Phase voltage
          '1.0.72.7.0.255'  // B Phase voltage
        ]);

        const hasVoltage = Object.values(data).some(voltage => voltage > 180); // Minimum voltage threshold
        
        if (!hasVoltage) {
          // Create power failure event
          await this.eventService.createEvent({
            meterId,
            eventType: 'POWER_FAILURE',
            eventCode: INDIAN_EVENT_CODES.POWER_FAILURE.code,
            description: INDIAN_EVENT_CODES.POWER_FAILURE.description,
            severity: INDIAN_EVENT_CODES.POWER_FAILURE.severity
          });
        } else {
          // Monitor for power restoration
          await this.eventService.monitorPowerRestoration(meterId);
        }
      } catch (error) {
        console.error('Error monitoring power status:', error);
      }
    }, 30000); // 30 seconds interval
  }
}

export default MeterCommunicationService; 