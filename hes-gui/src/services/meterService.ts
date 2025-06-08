const API_BASE_URL = 'http://localhost:8080/api';

export const meterService = {
  async connectMeter(meterId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/meters/${meterId}/connect`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to connect meter');
    }
  },

  async disconnectMeter(meterId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/meters/${meterId}/disconnect`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to disconnect meter');
    }
  },

  async getMeters(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/meters`);
    if (!response.ok) {
      throw new Error('Failed to fetch meters');
    }
    return response.json();
  },

  async getMeterReadings(meterId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/meters/${meterId}/readings`);
    if (!response.ok) {
      throw new Error('Failed to fetch meter readings');
    }
    return response.json();
  }
}; 