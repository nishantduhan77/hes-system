"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMeterConfiguration = exports.getMeterConfiguration = exports.sendMeterCommand = exports.acknowledgeMeterAlarm = exports.fetchMeterAlarms = exports.fetchMeterEvents = exports.fetchMeterProfiles = void 0;
const axios_1 = __importDefault(require("axios"));
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';
const api = axios_1.default.create({
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
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
const fetchMeterProfiles = async (params) => {
    const { data } = await api.get('/meters/profiles', { params });
    return data.map((profile) => ({
        ...profile,
        timestamp: new Date(profile.timestamp)
    }));
};
exports.fetchMeterProfiles = fetchMeterProfiles;
const fetchMeterEvents = async (params) => {
    const { data } = await api.get('/meters/events', { params });
    return data.map((event) => ({
        ...event,
        timestamp: new Date(event.timestamp)
    }));
};
exports.fetchMeterEvents = fetchMeterEvents;
const fetchMeterAlarms = async (params) => {
    const { data } = await api.get('/meters/alarms', { params });
    return data.map((alarm) => ({
        ...alarm,
        timestamp: new Date(alarm.timestamp),
        acknowledgedAt: alarm.acknowledgedAt ? new Date(alarm.acknowledgedAt) : undefined,
        clearedAt: alarm.clearedAt ? new Date(alarm.clearedAt) : undefined
    }));
};
exports.fetchMeterAlarms = fetchMeterAlarms;
const acknowledgeMeterAlarm = async (alarmId, userId) => {
    await api.post(`/meters/alarms/${alarmId}/acknowledge`, { userId });
};
exports.acknowledgeMeterAlarm = acknowledgeMeterAlarm;
const sendMeterCommand = async (meterId, command, parameters) => {
    await api.post(`/meters/${meterId}/commands`, {
        type: command,
        parameters,
        timestamp: new Date()
    });
};
exports.sendMeterCommand = sendMeterCommand;
const getMeterConfiguration = async (meterId) => {
    const { data } = await api.get(`/meters/${meterId}/configuration`);
    return data;
};
exports.getMeterConfiguration = getMeterConfiguration;
const updateMeterConfiguration = async (meterId, configuration) => {
    await api.put(`/meters/${meterId}/configuration`, configuration);
};
exports.updateMeterConfiguration = updateMeterConfiguration;
