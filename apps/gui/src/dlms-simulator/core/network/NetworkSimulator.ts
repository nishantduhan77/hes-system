import { EventEmitter } from 'events';

export type ConnectionType = 'GPRS' | 'PLC' | 'TCP';

export interface NetworkConfig {
    minLatency: number;
    maxLatency: number;
    packetLossRate: number;
    jitter: number;
    bandwidth: number;
    connectionType: ConnectionType;
}

export interface NetworkStats {
    totalPackets: number;
    lostPackets: number;
    averageLatency: number;
    currentBandwidth: number;
    connectionStatus: 'connected' | 'disconnected' | 'degraded';
}

export class NetworkSimulator extends EventEmitter {
    private config: NetworkConfig;
    private stats: NetworkStats;
    private isConnected: boolean;
    private lastLatency: number = 0;
    private static readonly DEFAULT_CONFIG: NetworkConfig = {
        minLatency: 100,
        maxLatency: 1000,
        packetLossRate: 0.01,
        jitter: 50,
        bandwidth: 1000000, // 1 Mbps
        connectionType: 'GPRS'
    };

    constructor(config: Partial<NetworkConfig> = {}) {
        super();
        this.config = {
            minLatency: 100,
            maxLatency: 1000,
            packetLossRate: 0.01,
            jitter: 50,
            bandwidth: 1000000, // 1 Mbps
            connectionType: 'GPRS',
            ...config
        };
        this.stats = {
            totalPackets: 0,
            lostPackets: 0,
            averageLatency: 0,
            currentBandwidth: this.config.bandwidth,
            connectionStatus: 'disconnected'
        };
        this.isConnected = false;
    }

    /**
     * Simulate sending data over the network
     */
    public async sendData(data: Buffer): Promise<Buffer> {
        if (!this.isConnected) {
            throw new Error('Network not connected');
        }

        this.stats.totalPackets++;

        // Simulate packet loss
        if (Math.random() < this.config.packetLossRate) {
            this.stats.lostPackets++;
            this.emit('packetLost', data);
            throw new Error('Packet lost');
        }

        // Calculate latency with jitter
        const baseLatency = this.getRandomLatency();
        const jitter = (Math.random() - 0.5) * 2 * this.config.jitter;
        const totalLatency = baseLatency + jitter;
        this.lastLatency = totalLatency;

        // Update average latency
        this.stats.averageLatency = (this.stats.averageLatency * (this.stats.totalPackets - 1) + totalLatency) / this.stats.totalPackets;

        // Simulate bandwidth limitation
        const transferTime = (data.length * 8) / this.config.bandwidth * 1000; // in ms
        await this.delay(totalLatency + transferTime);

        this.emit('dataSent', { data, latency: totalLatency });
        return data;
    }

    /**
     * Simulate receiving data over the network
     */
    public async receiveData(data: Buffer): Promise<Buffer> {
        if (!this.isConnected) {
            throw new Error('Network not connected');
        }

        this.stats.totalPackets++;

        // Simulate packet loss
        if (Math.random() < this.config.packetLossRate) {
            this.stats.lostPackets++;
            this.emit('packetLost', data);
            throw new Error('Packet lost');
        }

        // Calculate latency with jitter
        const baseLatency = this.getRandomLatency();
        const jitter = (Math.random() - 0.5) * 2 * this.config.jitter;
        const totalLatency = baseLatency + jitter;
        this.lastLatency = totalLatency;

        // Update average latency
        this.stats.averageLatency = (this.stats.averageLatency * (this.stats.totalPackets - 1) + totalLatency) / this.stats.totalPackets;

        // Simulate bandwidth limitation
        const transferTime = (data.length * 8) / this.config.bandwidth * 1000; // in ms
        await this.delay(totalLatency + transferTime);

        this.emit('dataReceived', { data, latency: totalLatency });
        return data;
    }

    /**
     * Connect to the network
     */
    public connect(): void {
        this.isConnected = true;
        this.stats.connectionStatus = 'connected';
        this.emit('connected');
    }

    /**
     * Disconnect from the network
     */
    public disconnect(): void {
        this.isConnected = false;
        this.stats.connectionStatus = 'disconnected';
        this.emit('disconnected');
    }

    /**
     * Simulate network degradation
     */
    public simulateDegradation(duration: number): void {
        this.stats.connectionStatus = 'degraded';
        this.emit('degraded');

        setTimeout(() => {
            if (this.isConnected) {
                this.stats.connectionStatus = 'connected';
                this.emit('recovered');
            }
        }, duration);
    }

    /**
     * Update network configuration
     */
    public updateConfig(config: Partial<NetworkConfig>): void {
        this.config = { ...this.config, ...config };
        this.stats.currentBandwidth = this.config.bandwidth;
        this.emit('configUpdated', this.config);
    }

    /**
     * Get current network statistics
     */
    public getStats(): NetworkStats {
        return { ...this.stats };
    }

    /**
     * Reset network simulator
     */
    public reset(): void {
        this.stats = {
            totalPackets: 0,
            lostPackets: 0,
            averageLatency: 0,
            currentBandwidth: this.config.bandwidth,
            connectionStatus: 'disconnected'
        };
        this.isConnected = false;
        this.emit('reset');
    }

    public isNetworkConnected(): boolean {
        return this.isConnected;
    }

    public getLastLatency(): number {
        return this.lastLatency;
    }

    public getConfig(): NetworkConfig {
        return { ...this.config };
    }

    private getRandomLatency(): number {
        return Math.random() * (this.config.maxLatency - this.config.minLatency) + this.config.minLatency;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 