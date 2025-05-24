import axios, { AxiosError } from 'axios';
import { Meter, MeterReading } from '../types/meter';
import { authService } from './auth';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication interceptor
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      authService.logout();
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    return Promise.reject(
      new Error(error.response?.data?.message || error.message)
    );
  }
);

export const meterApi = {
  // Meter Management
  getAllMeters: () => api.get<Meter[]>('/meters'),
  getMeterById: (id: number) => api.get<Meter>(`/meters/${id}`),
  createMeter: (meter: Omit<Meter, 'id' | 'status'>) => 
    api.post<Meter>('/meters', meter),
  updateMeter: (id: number, meter: Partial<Meter>) =>
    api.put<Meter>(`/meters/${id}`, meter),
  deleteMeter: (id: number) => api.delete(`/meters/${id}`),

  // Meter Readings
  getMeterReadings: (meterId: string) =>
    api.get<MeterReading[]>(`/meters/${meterId}/readings`),
  getLatestReading: (meterId: string) =>
    api.get<MeterReading>(`/meters/${meterId}/readings/latest`),

  // Meter Operations
  connectMeter: (id: number) => api.post(`/meters/${id}/connect`),
  disconnectMeter: (id: number) => api.post(`/meters/${id}/disconnect`),
};

export const systemApi = {
  getSystemStatus: () => api.get('/system/status'),
  getSystemMetrics: () => api.get('/system/metrics'),
  getRecentEvents: () => api.get('/system/events'),
  getAlerts: () => api.get('/system/alerts'),
}; 