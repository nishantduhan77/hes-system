import axios from 'axios';
import { MeterProfile, MeterEvent, MeterAlarm } from '../types/meter';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const fetchMeterProfiles = async (params?: {
    startTime?: Date;
    endTime?: Date;
    meterIds?: string[];
}): Promise<MeterProfile[]> => {
    const { data } = await api.get('/meters/profiles', { params });
    return data.map((profile: any) => ({
        ...profile,
        timestamp: new Date(profile.timestamp)
    }));
};

export const fetchMeterEvents = async (params?: {
    startTime?: Date;
    endTime?: Date;
    meterIds?: string[];
    severity?: string[];
}): Promise<MeterEvent[]> => {
    const { data } = await api.get('/meters/events', { params });
    return data.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
    }));
};

export const fetchMeterAlarms = async (params?: {
    status?: ('ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED')[];
    meterIds?: string[];
}): Promise<MeterAlarm[]> => {
    const { data } = await api.get('/meters/alarms', { params });
    return data.map((alarm: any) => ({
        ...alarm,
        timestamp: new Date(alarm.timestamp),
        acknowledgedAt: alarm.acknowledgedAt ? new Date(alarm.acknowledgedAt) : undefined,
        clearedAt: alarm.clearedAt ? new Date(alarm.clearedAt) : undefined
    }));
};

export const acknowledgeMeterAlarm = async (alarmId: string, userId: string): Promise<void> => {
    await api.post(`/meters/alarms/${alarmId}/acknowledge`, { userId });
};

export const sendMeterCommand = async (
    meterId: string,
    command: string,
    parameters: Record<string, any>
): Promise<void> => {
    await api.post(`/meters/${meterId}/commands`, {
        type: command,
        parameters,
        timestamp: new Date()
    });
};

export const getMeterConfiguration = async (meterId: string) => {
    const { data } = await api.get(`/meters/${meterId}/configuration`);
    return data;
};

export const updateMeterConfiguration = async (
    meterId: string,
    configuration: Partial<any>
): Promise<void> => {
    await api.put(`/meters/${meterId}/configuration`, configuration);
}; 