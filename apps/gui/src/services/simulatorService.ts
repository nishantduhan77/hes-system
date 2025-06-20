import { MultiMeterSimulator } from '../dlms-simulator/core/meter/MultiMeterSimulator';
import { MeterConfig, MeterState } from '../dlms-simulator/core/meter/MultiMeterSimulator';
import axios from 'axios';

// Create a singleton instance of the simulator
const simulator = new MultiMeterSimulator();

const API_BASE_URL = 'http://localhost:3000/api';

export const simulatorService = {
    // Meter Management
    async addMeter(config: MeterConfig): Promise<void> {
        simulator.addMeter(config);
    },

    async removeMeter(meterId: string): Promise<void> {
        simulator.removeMeter(meterId);
    },

    async connectMeter(meterId: string): Promise<void> {
        simulator.connectMeter(meterId);
    },

    async disconnectMeter(meterId: string): Promise<void> {
        simulator.disconnectMeter(meterId);
    },

    async getMeters(): Promise<MeterState[]> {
        const response = await axios.get(`${API_BASE_URL}/meters`);
        return response.data as MeterState[];
    },

    async getMeterConfig(meterId: string): Promise<MeterConfig> {
        return simulator.getMeterConfig(meterId);
    },

    async updateMeterConfig(meterId: string, config: Partial<MeterConfig>): Promise<void> {
        simulator.updateMeterConfig(meterId, config);
    },

    // Data Operations
    async sendData(meterId: string, data: Buffer): Promise<Buffer> {
        return simulator.sendData(meterId, data);
    },

    async receiveData(meterId: string, data: Buffer): Promise<Buffer> {
        return simulator.receiveData(meterId, data);
    },

    // Event Operations
    async getEvents(meterId: string): Promise<any[]> {
        const meter = simulator.getMeter(meterId);
        return meter.eventManager.getEvents();
    },

    async clearEvents(meterId: string): Promise<void> {
        const meter = simulator.getMeter(meterId);
        meter.eventManager.clearEvents();
    },

    // Network Operations
    async getNetworkStats(meterId: string): Promise<any> {
        const response = await axios.get(`${API_BASE_URL}/meters/${meterId}/network-stats`);
        return response.data;
    },

    async updateNetworkConfig(meterId: string, config: any): Promise<void> {
        const meter = simulator.getMeter(meterId);
        meter.networkSimulator.updateConfig(config);
    },

    // Security Operations
    async getSecurityConfig(meterId: string): Promise<any> {
        const response = await axios.get(`${API_BASE_URL}/meters/${meterId}/security-config`);
        return response.data;
    },

    async updateSecurityConfig(meterId: string, config: any): Promise<void> {
        const meter = simulator.getMeter(meterId);
        meter.securityManager.updateConfig(config);
    },

    // Reset Operations
    async resetMeter(meterId: string): Promise<void> {
        const meter = simulator.getMeter(meterId);
        meter.securityManager.reset();
        meter.eventManager.reset();
        meter.networkSimulator.reset();
        meter.obisManager.reset();
    },

    async resetAll(): Promise<void> {
        simulator.reset();
    },

    async getMeterById(id: string) {
        const response = await axios.get(`${API_BASE_URL}/meters/${id}`);
        return response.data;
    },

    async getAlarms() {
        const response = await axios.get(`${API_BASE_URL}/alarms`);
        return response.data;
    },

    async addMeter(config: any) {
        const response = await axios.post(`${API_BASE_URL}/meters`, config);
        return response.data;
    },

    async getEvents() {
        const response = await axios.get(`${API_BASE_URL}/events`);
        return response.data;
    },

    async connectMeter(id: string) {
        const response = await axios.post(`${API_BASE_URL}/meters/${id}/connect`);
        return response.data;
    },

    async disconnectMeter(id: string) {
        const response = await axios.post(`${API_BASE_URL}/meters/${id}/disconnect`);
        return response.data;
    },

    async getNetworkStats(id: string) {
        const response = await axios.get(`${API_BASE_URL}/meters/${id}/network-stats`);
        return response.data;
    },

    async getSecurityConfig(id: string) {
        const response = await axios.get(`${API_BASE_URL}/meters/${id}/security-config`);
        return response.data;
    }
}; 