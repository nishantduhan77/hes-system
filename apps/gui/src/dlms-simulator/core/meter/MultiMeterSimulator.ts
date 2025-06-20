import { EventEmitter } from 'events';
import { SecurityManager, SecurityConfig } from '../security/SecurityManager';
import { EventManager, EventConfig } from '../events/EventManager';
import { NetworkSimulator, NetworkConfig } from '../network/NetworkSimulator';
import { CustomObisManager } from './CustomObisManager';

export interface MeterConfig {
    meterId: string;
    serialNumber: string;
    model: string;
    firmwareVersion: string;
    security: {
        securityLevel: number;
        authenticationType: number;
    };
    events: EventConfig;
    network: NetworkConfig;
}

export interface MeterState {
    meterId: string;
    isConnected: boolean;
    lastCommunication: number;
    currentTariff: number;
    currentLoad: number;
    batteryLevel: number;
    eswfBits: number;
}

export class MultiMeterSimulator extends EventEmitter {
    private meters: Map<string, {
        config: MeterConfig;
        obisManager: CustomObisManager;
        eventManager: EventManager;
        networkSimulator: NetworkSimulator;
        securityManager: SecurityManager;
        state: MeterState;
    }> = new Map();

    constructor() {
        super();
    }

    /**
     * Add a new meter to the simulator
     */
    public addMeter(config: MeterConfig): void {
        if (this.meters.has(config.meterId)) {
            throw new Error(`Meter ${config.meterId} already exists`);
        }

        const obisManager = new CustomObisManager();
        const eventManager = new EventManager(obisManager, config.events);
        const networkSimulator = new NetworkSimulator(config.network);
        const securityManager = new SecurityManager(config.security);

        const state: MeterState = {
            meterId: config.meterId,
            isConnected: false,
            lastCommunication: Date.now(),
            currentTariff: 1,
            currentLoad: 0,
            batteryLevel: 100,
            eswfBits: 0
        };

        this.meters.set(config.meterId, {
            config,
            obisManager,
            eventManager,
            networkSimulator,
            securityManager,
            state
        });

        this.emit('meterAdded', config.meterId);
    }

    /**
     * Remove a meter from the simulator
     */
    public removeMeter(meterId: string): void {
        if (!this.meters.has(meterId)) {
            throw new Error(`Meter ${meterId} not found`);
        }
        this.meters.delete(meterId);
        this.emit('meterRemoved', meterId);
    }

    /**
     * Connect a meter to the network
     */
    public connectMeter(meterId: string): void {
        const meter = this.getMeter(meterId);
        meter.networkSimulator.connect();
        meter.state.isConnected = true;
        meter.state.lastCommunication = Date.now();
        this.emit('meterConnected', meterId);
    }

    /**
     * Disconnect a meter from the network
     */
    public disconnectMeter(meterId: string): void {
        const meter = this.getMeter(meterId);
        meter.networkSimulator.disconnect();
        meter.state.isConnected = false;
        this.emit('meterDisconnected', meterId);
    }

    /**
     * Send data to a specific meter
     */
    public async sendData(meterId: string, data: Buffer): Promise<Buffer> {
        const meter = this.getMeter(meterId);
        
        // Update meter state
        meter.state.lastCommunication = Date.now();
        meter.state.isConnected = true;

        try {
            // Send data through network simulator
            const response = await meter.networkSimulator.sendData(data);
            this.emit('dataSent', { meterId, data: response });
            return response;
        } catch (error) {
            meter.state.isConnected = false;
            this.emit('error', { meterId, error });
            throw error;
        }
    }

    /**
     * Receive data from a specific meter
     */
    public async receiveData(meterId: string, data: Buffer): Promise<Buffer> {
        const meter = this.getMeter(meterId);
        
        // Update meter state
        meter.state.lastCommunication = Date.now();
        meter.state.isConnected = true;

        try {
            // Receive data through network simulator
            const response = await meter.networkSimulator.receiveData(data);
            
            // Apply security
            const decryptedData = meter.securityManager.decryptData(response);
            
            this.emit('dataReceived', { meterId, data: decryptedData });
            return decryptedData;
        } catch (error) {
            meter.state.isConnected = false;
            this.emit('error', { meterId, error });
            throw error;
        }
    }

    /**
     * Update meter configuration
     */
    public updateMeterConfig(meterId: string, config: Partial<MeterConfig>): void {
        const meter = this.getMeter(meterId);
        meter.config = { ...meter.config, ...config };
        
        // Update network simulator if network config changed
        if (config.network) {
            meter.networkSimulator.updateConfig(config.network);
        }
        
        // Update event manager if events config changed
        if (config.events) {
            meter.eventManager.updateConfig(config.events);
        }
        
        // Update security manager if security config changed
        if (config.security) {
            meter.securityManager.updateConfig(config.security);
        }
        
        this.emit('configUpdated', { meterId, config });
    }

    /**
     * Get meter state
     */
    public getMeterState(meterId: string): MeterState {
        const meter = this.getMeter(meterId);
        return { ...meter.state };
    }

    /**
     * Get all meter states
     */
    public getAllMeterStates(): MeterState[] {
        return Array.from(this.meters.values()).map(meter => ({ ...meter.state }));
    }

    /**
     * Get meter by ID
     */
    public getMeter(meterId: string) {
        const meter = this.meters.get(meterId);
        if (!meter) {
            throw new Error(`Meter ${meterId} not found`);
        }
        return meter;
    }

    /**
     * Reset all meters
     */
    public reset(): void {
        this.meters.forEach(meter => {
            meter.securityManager.reset();
            meter.eventManager.reset();
            meter.networkSimulator.reset();
            meter.obisManager.reset();
        });
        this.emit('reset');
    }

    public getMeterConfig(meterId: string): MeterConfig {
        const meter = this.getMeter(meterId);
        return { ...meter.config };
    }

    public getAllMeterConfigs(): MeterConfig[] {
        return Array.from(this.meters.values()).map(meter => ({ ...meter.config }));
    }

    public getConnectedMeters(): string[] {
        return Array.from(this.meters.entries())
            .filter(([_, meter]) => meter.state.isConnected)
            .map(([meterId]) => meterId);
    }

    public getDisconnectedMeters(): string[] {
        return Array.from(this.meters.entries())
            .filter(([_, meter]) => !meter.state.isConnected)
            .map(([meterId]) => meterId);
    }

    public getMetersByModel(model: string): string[] {
        return Array.from(this.meters.entries())
            .filter(([_, meter]) => meter.config.model === model)
            .map(([meterId]) => meterId);
    }

    public getMetersByFirmwareVersion(version: string): string[] {
        return Array.from(this.meters.entries())
            .filter(([_, meter]) => meter.config.firmwareVersion === version)
            .map(([meterId]) => meterId);
    }
} 