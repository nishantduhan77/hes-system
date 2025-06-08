import { Socket } from 'net';
import { EventEmitter } from 'events';
import { Logger } from 'winston';

/**
 * GPRS Connection Configuration
 */
export interface GprsConfig {
    host: string;
    port: number;
    keepAliveInterval: number;  // in milliseconds
    reconnectInterval: number;  // in milliseconds
    simCardApn: string;
    connectionTimeout: number;  // in milliseconds
}

/**
 * Default GPRS configuration
 */
const DEFAULT_CONFIG: GprsConfig = {
    host: 'localhost',
    port: 4059,  // Default DLMS/COSEM port
    keepAliveInterval: 60000,   // 1 minute
    reconnectInterval: 30000,   // 30 seconds
    simCardApn: 'internet',     // Default APN
    connectionTimeout: 30000    // 30 seconds
};

/**
 * GPRS Connection States
 */
export enum GprsState {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    AUTHENTICATING = 'AUTHENTICATING',
    READY = 'READY',
    ERROR = 'ERROR'
}

/**
 * GPRS Communication Handler
 * Implements communication over GPRS for smart meters
 */
export class GprsCommunicator extends EventEmitter {
    private config: GprsConfig;
    private socket: Socket | null;
    private state: GprsState;
    private keepAliveTimer: NodeJS.Timeout | null;
    private reconnectTimer: NodeJS.Timeout | null;
    private logger: Logger;
    private buffer: Buffer;

    constructor(config: Partial<GprsConfig>, logger: Logger) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.socket = null;
        this.state = GprsState.DISCONNECTED;
        this.keepAliveTimer = null;
        this.reconnectTimer = null;
        this.logger = logger;
        this.buffer = Buffer.alloc(0);

        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.handleData = this.handleData.bind(this);
        this.handleError = this.handleError.bind(this);
        this.sendKeepAlive = this.sendKeepAlive.bind(this);
    }

    /**
     * Connect to the meter via GPRS
     */
    public async connect(): Promise<void> {
        if (this.state === GprsState.CONNECTING || this.state === GprsState.CONNECTED) {
            return;
        }

        this.setState(GprsState.CONNECTING);
        this.socket = new Socket();

        return new Promise((resolve, reject) => {
            const connectTimeout = setTimeout(() => {
                this.handleError(new Error('Connection timeout'));
                reject(new Error('Connection timeout'));
            }, this.config.connectionTimeout);

            this.socket!.on('connect', () => {
                clearTimeout(connectTimeout);
                this.setState(GprsState.CONNECTED);
                this.setupKeepAlive();
                this.logger.info(`GPRS connection established to ${this.config.host}:${this.config.port}`);
                resolve();
            });

            this.socket!.on('data', this.handleData);
            this.socket!.on('error', this.handleError);
            this.socket!.on('close', () => {
                this.handleDisconnect();
                this.scheduleReconnect();
            });

            this.socket!.connect({
                host: this.config.host,
                port: this.config.port
            });
        });
    }

    /**
     * Disconnect from the meter
     */
    public disconnect(): void {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.clearTimers();
        this.setState(GprsState.DISCONNECTED);
    }

    /**
     * Send data to the meter
     */
    public send(data: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket || this.state !== GprsState.CONNECTED) {
                reject(new Error('Not connected'));
                return;
            }

            this.socket.write(data, (error) => {
                if (error) {
                    this.logger.error('Error sending data:', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Handle incoming data
     */
    private handleData(data: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, data]);
        
        // Process DLMS frames
        // TODO: Implement DLMS frame parsing
        this.emit('data', data);
    }

    /**
     * Handle connection errors
     */
    private handleError(error: Error): void {
        this.logger.error('GPRS connection error:', error);
        this.setState(GprsState.ERROR);
        this.emit('error', error);
    }

    /**
     * Handle disconnection
     */
    private handleDisconnect(): void {
        this.logger.info('GPRS connection closed');
        this.setState(GprsState.DISCONNECTED);
        this.clearTimers();
        this.emit('disconnect');
    }

    /**
     * Set up keep-alive mechanism
     */
    private setupKeepAlive(): void {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
        }
        this.keepAliveTimer = setInterval(this.sendKeepAlive, this.config.keepAliveInterval);
    }

    /**
     * Send keep-alive message
     */
    private async sendKeepAlive(): Promise<void> {
        try {
            // TODO: Implement proper keep-alive frame according to your protocol
            const keepAliveFrame = Buffer.from([0x00]); // Placeholder
            await this.send(keepAliveFrame);
            this.logger.debug('Keep-alive sent');
        } catch (error) {
            this.logger.error('Failed to send keep-alive:', error);
        }
    }

    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.connect();
            } catch (error) {
                this.logger.error('Reconnection failed:', error);
            }
        }, this.config.reconnectInterval);
    }

    /**
     * Clear all timers
     */
    private clearTimers(): void {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Update connection state
     */
    private setState(state: GprsState): void {
        this.state = state;
        this.emit('stateChange', state);
    }

    /**
     * Get current connection state
     */
    public getState(): GprsState {
        return this.state;
    }

    /**
     * Get connection info
     */
    public getConnectionInfo(): { host: string; port: number; state: GprsState } {
        return {
            host: this.config.host,
            port: this.config.port,
            state: this.state
        };
    }
} 