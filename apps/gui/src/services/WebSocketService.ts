import { EventEmitter } from 'events';

export interface MeterUpdate {
  meterId: string;
  timestamp: string;
  readings: {
    obisCode: string;
    value: number;
    unit: string;
  }[];
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private eventEmitter: EventEmitter;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 5000;

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect() {
    try {
      this.ws = new WebSocket('ws://localhost:8080/meter-updates');

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: MeterUpdate = JSON.parse(event.data);
          this.eventEmitter.emit('meterUpdate', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectTimeout);
    }
  }

  public subscribe(meterId: string, callback: (data: MeterUpdate) => void) {
    const handler = (data: MeterUpdate) => {
      if (data.meterId === meterId) {
        callback(data);
      }
    };
    this.eventEmitter.on('meterUpdate', handler);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', meterId }));
    }

    return () => {
      this.eventEmitter.off('meterUpdate', handler);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'unsubscribe', meterId }));
      }
    };
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService; 