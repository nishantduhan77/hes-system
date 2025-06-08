import { MeterReading } from '../types/meter';

// Mock WebSocket class
class MockWebSocket extends EventTarget {
  private intervalId: number | null = null;
  private readingTypes = ['V', 'A', 'kW'];
  private readingIndex = 0;

  constructor(private url: string) {
    super();
    this.startSendingReadings();
  }

  private startSendingReadings() {
    // Simulate readings every 2 seconds
    this.intervalId = window.setInterval(() => {
      const meterId = '1'; // Mock meter ID
      const unit = this.readingTypes[this.readingIndex];
      
      // Cycle through reading types
      this.readingIndex = (this.readingIndex + 1) % this.readingTypes.length;

      const reading: MeterReading = {
        id: `${Date.now()}`,
        meterId,
        timestamp: new Date().toISOString(),
        value: this.generateValue(unit),
        unit,
        status: 'VALID'
      };

      // Dispatch message event
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'METER_READING',
          data: reading
        })
      });
      this.dispatchEvent(messageEvent);
    }, 2000);
  }

  private generateValue(unit: string): number {
    switch (unit) {
      case 'V':
        return 220 + Math.random() * 20; // 220V ± 10V
      case 'A':
        return 5 + Math.random() * 2; // 5A ± 1A
      case 'kW':
        return 1 + Math.random() * 0.5; // 1kW ± 0.25kW
      default:
        return 0;
    }
  }

  close() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
    }
  }

  // Mock WebSocket interface
  get readyState() { return 1; } // WebSocket.OPEN
  send() {} // No-op for mock
}

// Override WebSocket in development
if (process.env.NODE_ENV === 'development') {
  (window as any).WebSocket = MockWebSocket;
}

export default MockWebSocket; 