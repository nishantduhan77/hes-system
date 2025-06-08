import axios from 'axios';

export interface MeterEvent {
  meterId: string;
  timestamp: string;
  eventType: string;
  eventCode: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  acknowledged: boolean;
}

// Indian Event Codes as per IS 15959
export const INDIAN_EVENT_CODES = {
  POWER_FAILURE: {
    code: '0x00010000',
    description: 'Power failure event',
    severity: 'HIGH' as const
  },
  POWER_RESTORATION: {
    code: '0x00010001',
    description: 'Power restoration event',
    severity: 'MEDIUM' as const
  },
  VOLTAGE_HIGH: {
    code: '0x00020000',
    description: 'Voltage high event',
    severity: 'HIGH' as const
  },
  VOLTAGE_LOW: {
    code: '0x00020001',
    description: 'Voltage low event',
    severity: 'HIGH' as const
  },
  CURRENT_HIGH: {
    code: '0x00030000',
    description: 'Current high event',
    severity: 'HIGH' as const
  },
  MAGNETIC_TAMPER: {
    code: '0x00040000',
    description: 'Magnetic tamper detected',
    severity: 'HIGH' as const
  },
  COVER_OPEN: {
    code: '0x00040001',
    description: 'Meter cover opened',
    severity: 'HIGH' as const
  },
  NEUTRAL_DISTURBANCE: {
    code: '0x00040002',
    description: 'Neutral disturbance detected',
    severity: 'HIGH' as const
  }
};

class MeterEventService {
  private static instance: MeterEventService;
  private subscribers: ((event: MeterEvent) => void)[] = [];

  private constructor() {}

  public static getInstance(): MeterEventService {
    if (!MeterEventService.instance) {
      MeterEventService.instance = new MeterEventService();
    }
    return MeterEventService.instance;
  }

  public subscribeToEvents(callback: (event: MeterEvent) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  public async publishEvent(event: MeterEvent): Promise<void> {
    this.subscribers.forEach(callback => callback(event));
  }

  // Create a new event
  public async createEvent(event: Omit<MeterEvent, 'timestamp' | 'acknowledged'>): Promise<MeterEvent> {
    try {
      const response = await axios.post(`${this.baseUrl}/events`, {
        ...event,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
      const newEvent = response.data;
      this.publishEvent(newEvent);
      return newEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  // Get events for a specific meter
  public async getMeterEvents(meterId: string, startDate?: Date, endDate?: Date): Promise<MeterEvent[]> {
    try {
      const params = {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      };
      const response = await axios.get(`${this.baseUrl}/meters/${meterId}/events`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch meter events:', error);
      throw error;
    }
  }

  // Acknowledge an event
  public async acknowledgeEvent(eventId: string): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/events/${eventId}/acknowledge`);
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
      throw error;
    }
  }

  // Monitor power restoration events
  public async monitorPowerRestoration(meterId: string): Promise<void> {
    try {
      // First check if there's an unacknowledged power failure event
      const events = await this.getMeterEvents(meterId);
      const lastPowerFailure = events.find(
        e => e.eventCode === INDIAN_EVENT_CODES.POWER_FAILURE.code && !e.acknowledged
      );

      if (lastPowerFailure) {
        // Create power restoration event
        await this.createEvent({
          meterId,
          eventType: 'POWER_RESTORATION',
          eventCode: INDIAN_EVENT_CODES.POWER_RESTORATION.code,
          description: INDIAN_EVENT_CODES.POWER_RESTORATION.description,
          severity: INDIAN_EVENT_CODES.POWER_RESTORATION.severity,
          parameters: {
            failureTimestamp: lastPowerFailure.timestamp,
            downtime: (new Date().getTime() - new Date(lastPowerFailure.timestamp).getTime()) / 1000 // in seconds
          }
        });

        // Acknowledge the power failure event
        await this.acknowledgeEvent(lastPowerFailure.meterId);
      }
    } catch (error) {
      console.error('Failed to monitor power restoration:', error);
      throw error;
    }
  }
}

export default MeterEventService; 