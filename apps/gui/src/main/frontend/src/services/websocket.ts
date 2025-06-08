import { MeterReading } from '../types/meter';

type WebSocketMessageType = 'METER_READING' | 'METER_STATUS' | 'SYSTEM_STATUS';

interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
}

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<WebSocketMessageType, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;

  constructor(private url: string) {}

  connect(token: string) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(`${this.url}?token=${token}`);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach((handler) => handler(message.data));
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const timeout = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect(localStorage.getItem('token') || '');
    }, timeout);
  }

  subscribe(type: WebSocketMessageType, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type) || [];
    this.messageHandlers.set(type, [...handlers, handler]);
  }

  unsubscribe(type: WebSocketMessageType, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type) || [];
    this.messageHandlers.set(
      type,
      handlers.filter((h) => h !== handler)
    );
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService(
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`
); 