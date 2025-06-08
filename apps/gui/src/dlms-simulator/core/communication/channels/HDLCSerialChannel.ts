import { EventEmitter } from 'events';
import { SerialPort, SerialPortOpenOptions } from 'serialport';
import { HDLCLayer, HDLCFrame } from '../../dlms/transport/HDLCLayer';
import { CommunicationState, PortConfiguration, ChannelStatistics } from '../CommunicationProfileManager';

/**
 * HDLC Serial Channel Class
 * Implements serial port-based HDLC communication
 */
export class HDLCSerialChannel extends EventEmitter {
    private port: SerialPort;
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
            throw new Error('HDLC configuration is required for HDLC serial channel');
        }

        this.config = config;
        this.hdlcLayer = new HDLCLayer(config.hdlcConfig);
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

        const { 
            baudRate = 9600,
            dataBits = 8,
            stopBits = 1,
            parity = 'none',
            flowControl = false
        } = config.parameters;

        this.port = new SerialPort({
            path: config.parameters.address || '',
            baudRate,
            dataBits,
            stopBits,
            parity,
            rtscts: flowControl,
            autoOpen: false
        });

        this.setupPortHandlers();
    }

    /**
     * Set up serial port event handlers
     */
    private setupPortHandlers(): void {
        this.port.on('open', () => {
            this.state = CommunicationState.OPEN;
            this.emit('connected');
        });

        this.port.on('close', () => {
            this.state = CommunicationState.CLOSED;
            this.emit('disconnected');
            this.scheduleReconnect();
        });

        this.port.on('error', (error: Error) => {
            this.statistics.errors++;
            this.statistics.lastError = error.message;
            this.emit('error', error);
        });

        this.port.on('data', (data: Buffer) => {
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

            const openTimeout = setTimeout(() => {
                this.port.removeAllListeners('open');
                this.port.removeAllListeners('error');
                this.state = CommunicationState.ERROR;
                resolve(false);
            }, 10000); // 10 seconds timeout

            this.port.once('open', () => {
                clearTimeout(openTimeout);
                this.state = CommunicationState.OPEN;
                resolve(true);
            });

            this.port.once('error', () => {
                clearTimeout(openTimeout);
                this.state = CommunicationState.ERROR;
                resolve(false);
            });

            this.port.open();
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

            this.port.once('close', () => {
                this.state = CommunicationState.CLOSED;
                resolve();
            });

            this.port.close();
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
                this.port.write(frame, (error?: Error) => {
                    if (error) {
                        this.statistics.errors++;
                        this.statistics.lastError = error.message;
                        resolve(false);
                    } else {
                        this.port.drain(() => {
                            this.statistics.bytesSent += frame.length;
                            this.statistics.messagesSent++;
                            this.statistics.lastActivity = new Date();
                            resolve(true);
                        });
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
        }, HDLCSerialChannel.RECONNECT_INTERVAL);
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