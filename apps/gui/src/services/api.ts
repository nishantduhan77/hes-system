import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

// Types
export interface MeterProfile {
    id: string;
    timestamp: string;
    meterNumber: string;
    readingValue: number;
    unit: string;
    profileType: string;
}

export interface MeterEvent {
    id: string;
    timestamp: string;
    meterNumber: string;
    eventType: string;
    description: string;
    severity: 'INFO' | 'WARNING' | 'ERROR';
}

export interface MeterData {
    id: string;
    meterNumber: string;
    timestamp: string;
    readingType: string;
    value: number;
    unit: string;
}

// API Functions
export const fetchMeterProfiles = async (): Promise<MeterProfile[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/meter-profiles`);
        return response.data;
    } catch (error) {
        console.error('Error fetching meter profiles:', error);
        throw error;
    }
};

export const fetchMeterEvents = async (): Promise<MeterEvent[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/meter-events`);
        return response.data;
    } catch (error) {
        console.error('Error fetching meter events:', error);
        throw error;
    }
};

export const fetchMeterData = async (
    meterNumber?: string,
    startDate?: string,
    endDate?: string
): Promise<MeterData[]> => {
    try {
        const params = new URLSearchParams();
        if (meterNumber) params.append('meterNumber', meterNumber);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const url = `${API_BASE_URL}/meter-data${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching meter data:', error);
        throw error;
    }
};

export const fetchMeterList = async (): Promise<string[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/meters`);
        return response.data;
    } catch (error) {
        console.error('Error fetching meter list:', error);
        throw error;
    }
}; 