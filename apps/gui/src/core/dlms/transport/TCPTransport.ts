import { EventEmitter } from 'events';
import * as net from 'net';

/**
 * TCP Transport Configuration
 */
export interface TCPConfig {
    host: string;
    port: number;
    connectTimeout: number;
    keepAlive: boolean;
    keepAliveInitialDelay: number;
}

/**
 * TCP Transport Implementation
 */
export class TCPTransport extends EventEmitter {
    private config: TCPConfig;
    private socket: net.Socket | null;
    private connected: boolean;
    private buffer: Buffer;

    constructor(config: TCPConfig) {
        super();
        this.config = config;
        this.socket = null;
        this.connected = false;
        this.buffer = Buffer.alloc(0);
    }

    /**
     * Connect to remote device
     */
    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                reject(new Error('Already connected'));
                return;
            }

            this.socket = new net.Socket();

            // Configure socket
            this.socket.setKeepAlive(
                this.config.keepAlive,
                this.config.keepAliveInitialDelay
            );

            // Handle connection
            this.socket.on('connect', () => {
                this.connected = true;
                this.emit('connected');
                resolve();
            });

            // Handle data
            this.socket.on('data', (data: Buffer) => {
                this.handleData(data);
            });

            // Handle errors
            this.socket.on('error', (error: Error) => {
                this.emit('error', error);
                if (!this.connected) {
                    reject(error);
                }
            });

            // Handle connection close
            this.socket.on('close', () => {
                this.connected = false;
                this.socket = null;
                this.emit('disconnected');
            });

            // Connect to remote device
            this.socket.connect({
                host: this.config.host,
                port: this.config.port
            });

            // Set connection timeout
            this.socket.setTimeout(this.config.connectTimeout);
        });
    }

    /**
     * Disconnect from remote device
     */
    public disconnect(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.connected || !this.socket) {
                resolve();
                return;
            }

            this.socket.end(() => {
                this.connected = false;
                this.socket = null;
                resolve();
            });
        });
    }

    /**
     * Send data to remote device
     */
    public send(data: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.connected || !this.socket) {
                reject(new Error('Not connected'));
                return;
            }

            this.socket.write(data, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Handle received data
     */
    private handleData(data: Buffer): void {
        // Append received data to buffer
        this.buffer = Buffer.concat([this.buffer, data]);

        // Process complete frames
        let offset = 0;
        while (offset < this.buffer.length) {
            // Check if we have a complete frame
            const frameLength = this.getFrameLength(this.buffer.slice(offset));
            if (frameLength === 0 || offset + frameLength > this.buffer.length) {
                break;
            }

            // Extract frame
            const frame = this.buffer.slice(offset, offset + frameLength);
            offset += frameLength;

            // Emit frame
            this.emit('frame', frame);
        }

        // Remove processed data from buffer
        this.buffer = this.buffer.slice(offset);
    }

    /**
     * Get frame length from buffer
     * This method should be implemented according to the specific protocol
     * being used (e.g., DLMS/COSEM wrapper or HDLC)
     */
    private getFrameLength(buffer: Buffer): number {
        if (buffer.length < 2) {
            return 0;
        }

        // For DLMS/COSEM wrapper protocol:
        // First two bytes contain the frame length
        return buffer.readUInt16BE(0) + 2;
    }

    /**
     * Check if connected
     */
    public isConnected(): boolean {
        return this.connected;
    }

    /**
     * Get local address
     */
    public getLocalAddress(): string | undefined {
        return this.socket?.localAddress;
    }

    /**
     * Get local port
     */
    public getLocalPort(): number | undefined {
        return this.socket?.localPort;
    }

    /**
     * Get remote address
     */
    public getRemoteAddress(): string | undefined {
        return this.socket?.remoteAddress;
    }

    /**
     * Get remote port
     */
    public getRemotePort(): number | undefined {
        return this.socket?.remotePort;
    }
} 