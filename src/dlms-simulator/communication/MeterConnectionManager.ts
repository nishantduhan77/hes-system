import { EventEmitter } from 'events';
import { GprsCommunicator, GprsConfig, GprsState } from './gprs/GprsCommunicator';
import { createLogger, Logger, format, transports } from 'winston';

/**
 * Meter connection information
 */
export interface MeterConnection {
    meterId: string;
    ipAddress: string;
    port: number;
    lastConnected?: Date;
    lastDisconnected?: Date;
    state: GprsState;
    retryCount: number;
}

/**
 * Connection manager configuration
 */
export interface ConnectionManagerConfig {
    maxRetries: number;
    maxConcurrentConnections: number;
    connectionTimeout: number;
    retryDelay: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ConnectionManagerConfig = {
    maxRetries: 3,
    maxConcurrentConnections: 1000,
    connectionTimeout: 30000,
    retryDelay: 5000
};

/**
 * Manages multiple meter connections
 */
export class MeterConnectionManager extends EventEmitter {
    private connections: Map<string, MeterConnection>;
    private communicators: Map<string, GprsCommunicator>;
    private config: ConnectionManagerConfig;
    private logger: Logger;

    constructor(config: Partial<ConnectionManagerConfig> = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.connections = new Map();
        this.communicators = new Map();
        
        // Initialize logger
        this.logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.Console(),
                new transports.File({ filename: 'meter-connections.log' })
            ]
        });
    }

    /**
     * Add a new meter connection
     */
    public async addMeter(meterId: string, ipAddress: string, port: number): Promise<void> {
        if (this.connections.size >= this.config.maxConcurrentConnections) {
            throw new Error('Maximum number of concurrent connections reached');
        }

        const connection: MeterConnection = {
            meterId,
            ipAddress,
            port,
            state: GprsState.DISCONNECTED,
            retryCount: 0
        };

        this.connections.set(meterId, connection);
        
        const gprsConfig: GprsConfig = {
            host: ipAddress,
            port,
            keepAliveInterval: 60000,
            reconnectInterval: this.config.retryDelay,
            simCardApn: 'internet',
            connectionTimeout: this.config.connectionTimeout
        };

        const communicator = new GprsCommunicator(gprsConfig, this.logger);
        this.communicators.set(meterId, communicator);

        // Set up event handlers
        communicator.on('stateChange', (state: GprsState) => {
            this.handleStateChange(meterId, state);
        });

        communicator.on('error', (error: Error) => {
            this.handleError(meterId, error);
        });

        communicator.on('data', (data: Buffer) => {
            this.handleData(meterId, data);
        });

        // Attempt initial connection
        try {
            await this.connect(meterId);
        } catch (error) {
            this.logger.error(`Failed to establish initial connection for meter ${meterId}:`, error);
        }
    }

    /**
     * Remove a meter connection
     */
    public async removeMeter(meterId: string): Promise<void> {
        const communicator = this.communicators.get(meterId);
        if (communicator) {
            await communicator.disconnect();
            this.communicators.delete(meterId);
        }
        this.connections.delete(meterId);
    }

    /**
     * Connect to a specific meter
     */
    public async connect(meterId: string): Promise<void> {
        const connection = this.connections.get(meterId);
        const communicator = this.communicators.get(meterId);

        if (!connection || !communicator) {
            throw new Error(`Meter ${meterId} not found`);
        }

        try {
            await communicator.connect();
            connection.lastConnected = new Date();
            connection.retryCount = 0;
        } catch (error) {
            connection.retryCount++;
            if (connection.retryCount >= this.config.maxRetries) {
                this.logger.error(`Max retries reached for meter ${meterId}`);
                throw error;
            }
            // Schedule retry
            setTimeout(() => this.connect(meterId), this.config.retryDelay);
        }
    }

    /**
     * Disconnect from a specific meter
     */
    public async disconnect(meterId: string): Promise<void> {
        const communicator = this.communicators.get(meterId);
        if (communicator) {
            await communicator.disconnect();
        }
    }

    /**
     * Send data to a specific meter
     */
    public async sendToMeter(meterId: string, data: Buffer): Promise<void> {
        const communicator = this.communicators.get(meterId);
        if (!communicator) {
            throw new Error(`Meter ${meterId} not found`);
        }

        try {
            await communicator.send(data);
        } catch (error) {
            this.logger.error(`Error sending data to meter ${meterId}:`, error);
            throw error;
        }
    }

    /**
     * Handle state changes
     */
    private handleStateChange(meterId: string, state: GprsState): void {
        const connection = this.connections.get(meterId);
        if (connection) {
            connection.state = state;
            if (state === GprsState.DISCONNECTED) {
                connection.lastDisconnected = new Date();
            } else if (state === GprsState.CONNECTED) {
                connection.lastConnected = new Date();
            }
        }
        this.emit('stateChange', { meterId, state });
    }

    /**
     * Handle connection errors
     */
    private handleError(meterId: string, error: Error): void {
        this.logger.error(`Error in meter ${meterId}:`, error);
        this.emit('error', { meterId, error });
    }

    /**
     * Handle incoming data
     */
    private handleData(meterId: string, data: Buffer): void {
        this.emit('data', { meterId, data });
    }

    /**
     * Get connection status for a meter
     */
    public getConnectionStatus(meterId: string): MeterConnection | undefined {
        return this.connections.get(meterId);
    }

    /**
     * Get all active connections
     */
    public getActiveConnections(): MeterConnection[] {
        return Array.from(this.connections.values())
            .filter(conn => conn.state === GprsState.CONNECTED);
    }

    /**
     * Get connection statistics
     */
    public getStatistics(): {
        total: number;
        active: number;
        disconnected: number;
        error: number;
    } {
        const connections = Array.from(this.connections.values());
        return {
            total: connections.length,
            active: connections.filter(c => c.state === GprsState.CONNECTED).length,
            disconnected: connections.filter(c => c.state === GprsState.DISCONNECTED).length,
            error: connections.filter(c => c.state === GprsState.ERROR).length
        };
    }
} 