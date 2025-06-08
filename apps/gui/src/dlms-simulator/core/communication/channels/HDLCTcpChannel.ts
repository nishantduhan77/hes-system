import { Socket } from 'net';
import { EventEmitter } from 'events';
import { HDLCLayer, HDLCFrame } from '../../dlms/transport/HDLCLayer';
import { CommunicationState, PortConfiguration, ChannelStatistics } from '../CommunicationProfileManager';

/**
 * HDLC TCP Channel Class
 * Implements TCP-based HDLC communication
 */
export class HDLCTcpChannel extends EventEmitter {
    private socket: Socket;
    private hdlcLayer: HDLCLayer;
    private config: PortConfiguration;
    private state: CommunicationState;
    private buffer: Buffer;
    private statistics: ChannelStatistics;
    private reconnectTimer?: NodeJS.Timeout;
    private static readonly RECONNECT_INTERVAL = 5000; // 5 seconds

    constructor(config: PortConfiguration) {
        super();
        if (!config.hdlcConfig) {
            throw new Error('HDLC configuration is required for HDLC TCP channel');
        }

        this.config = config;
        this.hdlcLayer = new HDLCLayer(config.hdlcConfig);
        this.socket = new Socket();
        this.state = CommunicationState.CLOSED;
        this.buffer = Buffer.alloc(0);
        this.statistics = {
            bytesReceived: 0,
            bytesSent: 0,
            messagesReceived: 0,
            messagesSent: 0,
            errors: 0,
            lastActivity: new Date()
        };

        this.setupSocketHandlers();
    }

    /**
     * Set up socket event handlers
     */
    private setupSocketHandlers(): void {
        this.socket.on('connect', () => {
            this.state = CommunicationState.OPEN;
            this.emit('connected');
        });

        this.socket.on('close', () => {
            this.state = CommunicationState.CLOSED;
            this.emit('disconnected');
            this.scheduleReconnect();
        });

        this.socket.on('error', (error: Error) => {
            this.statistics.errors++;
            this.statistics.lastError = error.message;
            this.emit('error', error);
        });

        this.socket.on('data', (data: Buffer) => {
            this.handleData(data);
        });
    }

    /**
     * Handle received data
     */
    private handleData(data: Buffer): void {
        this.statistics.bytesReceived += data.length;
        this.statistics.lastActivity = new Date();

        // Append received data to buffer
        this.buffer = Buffer.concat([this.buffer, data]);

        // Process complete frames
        let frame: HDLCFrame | null;
        while ((frame = this.hdlcLayer.parseFrame(this.buffer))) {
            const frameLength = frame.frameLength;
            this.buffer = this.buffer.slice(frameLength);

            this.statistics.messagesReceived++;
            this.emit('frame', frame);
        }
    }

    /**
     * Open the channel
     */
    public async open(): Promise<boolean> {
        if (this.state === CommunicationState.OPEN) {
            return true;
        }

        return new Promise((resolve) => {
            this.state = CommunicationState.OPENING;

            const connectTimeout = setTimeout(() => {
                this.socket.removeAllListeners('connect');
                this.socket.removeAllListeners('error');
                this.state = CommunicationState.ERROR;
                resolve(false);
            }, 10000); // 10 seconds timeout

            this.socket.once('connect', () => {
                clearTimeout(connectTimeout);
                this.state = CommunicationState.OPEN;
                resolve(true);
            });

            this.socket.once('error', () => {
                clearTimeout(connectTimeout);
                this.state = CommunicationState.ERROR;
                resolve(false);
            });

            const { address, port } = this.config.parameters;
            if (!address || !port) {
                throw new Error('TCP address and port are required');
            }

            this.socket.connect({
                host: address,
                port: port
            });
        });
    }

    /**
     * Close the channel
     */
    public async close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.state === CommunicationState.CLOSED) {
                resolve();
                return;
            }

            this.state = CommunicationState.CLOSING;
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = undefined;
            }

            this.socket.once('close', () => {
                this.state = CommunicationState.CLOSED;
                resolve();
            });

            this.socket.end();
        });
    }

    /**
     * Send data through the channel
     */
    public async send(data: Buffer): Promise<boolean> {
        if (this.state !== CommunicationState.OPEN) {
            return false;
        }

        try {
            const frame = this.hdlcLayer.createFrame(0x00, data);
            return new Promise((resolve) => {
                this.socket.write(frame, (error) => {
                    if (error) {
                        this.statistics.errors++;
                        this.statistics.lastError = error.message;
                        resolve(false);
                    } else {
                        this.statistics.bytesSent += frame.length;
                        this.statistics.messagesSent++;
                        this.statistics.lastActivity = new Date();
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            this.statistics.errors++;
            this.statistics.lastError = error instanceof Error ? error.message : 'Unknown error';
            return false;
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
            if (this.state === CommunicationState.CLOSED) {
                await this.open();
            }
        }, HDLCTcpChannel.RECONNECT_INTERVAL);
    }

    /**
     * Get channel state
     */
    public getState(): CommunicationState {
        return this.state;
    }

    /**
     * Get channel statistics
     */
    public getStatistics(): ChannelStatistics {
        return { ...this.statistics };
    }
} 