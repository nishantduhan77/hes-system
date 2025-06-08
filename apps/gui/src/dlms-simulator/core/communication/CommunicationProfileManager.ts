import { EventEmitter } from 'events';
import { HDLCConfig, HDLCLayer } from '../dlms/transport/HDLCLayer';

export enum CommunicationChannelType {
    HDLC_SERIAL = 'HDLC_SERIAL',
    HDLC_TCP = 'HDLC_TCP',
    WRAPPER = 'WRAPPER',
    UDP = 'UDP'
}

export enum CommunicationState {
    CLOSED = 'CLOSED',
    OPENING = 'OPENING',
    OPEN = 'OPEN',
    CLOSING = 'CLOSING',
    ERROR = 'ERROR'
}

export interface PortConfiguration {
    portId: string;
    channelType: CommunicationChannelType;
    parameters: {
        address?: string;
        port?: number;
        baudRate?: number;
        dataBits?: number;
        stopBits?: number;
        parity?: 'none' | 'even' | 'odd';
        flowControl?: boolean;
    };
    hdlcConfig?: HDLCConfig;
}

export interface MessageQueueItem {
    id: string;
    priority: number;
    timestamp: Date;
    data: Buffer;
    retryCount: number;
    maxRetries: number;
    timeout: number;
}

export interface ChannelStatistics {
    bytesReceived: number;
    bytesSent: number;
    messagesReceived: number;
    messagesSent: number;
    errors: number;
    lastError?: string;
    lastActivity: Date;
}

/**
 * Communication Channel Class
 * Manages individual communication channel
 */
class CommunicationChannel extends EventEmitter {
    private portConfig: PortConfiguration;
    private state: CommunicationState;
    private messageQueue: MessageQueueItem[];
    private statistics: ChannelStatistics;
    private hdlcLayer?: HDLCLayer;

    constructor(config: PortConfiguration) {
        super();
        this.portConfig = config;
        this.state = CommunicationState.CLOSED;
        this.messageQueue = [];
        this.statistics = {
            bytesReceived: 0,
            bytesSent: 0,
            messagesReceived: 0,
            messagesSent: 0,
            errors: 0,
            lastActivity: new Date()
        };

        if (config.hdlcConfig) {
            this.hdlcLayer = new HDLCLayer(config.hdlcConfig);
        }
    }

    /**
     * Open the communication channel
     */
    public async open(): Promise<boolean> {
        try {
            this.state = CommunicationState.OPENING;
            // Implementation depends on channel type
            // This is a placeholder for actual channel opening logic
            this.state = CommunicationState.OPEN;
            return true;
        } catch (error) {
            this.state = CommunicationState.ERROR;
            this.statistics.errors++;
            this.statistics.lastError = error instanceof Error ? error.message : 'Unknown error';
            return false;
        }
    }

    /**
     * Close the communication channel
     */
    public async close(): Promise<void> {
        this.state = CommunicationState.CLOSING;
        // Implementation depends on channel type
        // This is a placeholder for actual channel closing logic
        this.state = CommunicationState.CLOSED;
    }

    /**
     * Queue a message for sending
     */
    public queueMessage(data: Buffer, priority: number = 1): string {
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const message: MessageQueueItem = {
            id: messageId,
            priority,
            timestamp: new Date(),
            data,
            retryCount: 0,
            maxRetries: 3,
            timeout: 5000
        };

        this.messageQueue.push(message);
        this.messageQueue.sort((a, b) => b.priority - a.priority);
        
        this.processQueue();
        return messageId;
    }

    /**
     * Process message queue
     */
    private async processQueue(): Promise<void> {
        if (this.state !== CommunicationState.OPEN || this.messageQueue.length === 0) {
            return;
        }

        const message = this.messageQueue[0];
        try {
            if (this.hdlcLayer) {
                const frame = this.hdlcLayer.createFrame(0x00, message.data);
                // Actual send implementation would go here
                this.statistics.bytesSent += frame.length;
                this.statistics.messagesSent++;
            } else {
                // Direct send without HDLC
                // Actual send implementation would go here
                this.statistics.bytesSent += message.data.length;
                this.statistics.messagesSent++;
            }

            this.messageQueue.shift();
            this.statistics.lastActivity = new Date();
            this.emit('messageSent', message.id);

        } catch (error) {
            message.retryCount++;
            this.statistics.errors++;
            this.statistics.lastError = error instanceof Error ? error.message : 'Unknown error';

            if (message.retryCount >= message.maxRetries) {
                this.messageQueue.shift();
                this.emit('messageError', message.id, this.statistics.lastError);
            }
        }
    }

    /**
     * Get channel statistics
     */
    public getStatistics(): ChannelStatistics {
        return { ...this.statistics };
    }

    /**
     * Get channel state
     */
    public getState(): CommunicationState {
        return this.state;
    }

    /**
     * Get queue length
     */
    public getQueueLength(): number {
        return this.messageQueue.length;
    }
}

/**
 * Communication Profile Manager Class
 * Manages communication profiles and channels
 */
export class CommunicationProfileManager extends EventEmitter {
    private channels: Map<string, CommunicationChannel>;
    private defaultChannelId?: string;

    constructor() {
        super();
        this.channels = new Map();
    }

    /**
     * Create a new communication channel
     */
    public async createChannel(config: PortConfiguration): Promise<boolean> {
        try {
            const channel = new CommunicationChannel(config);
            this.channels.set(config.portId, channel);

            // Set as default if first channel
            if (!this.defaultChannelId) {
                this.defaultChannelId = config.portId;
            }

            // Forward channel events
            channel.on('messageSent', (messageId: string) => {
                this.emit('messageSent', config.portId, messageId);
            });

            channel.on('messageError', (messageId: string, error: string) => {
                this.emit('messageError', config.portId, messageId, error);
            });

            const success = await channel.open();
            if (success) {
                this.emit('channelCreated', config.portId);
            }
            return success;

        } catch (error) {
            this.emit('error', config.portId, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    /**
     * Close and remove a communication channel
     */
    public async removeChannel(portId: string): Promise<void> {
        const channel = this.channels.get(portId);
        if (channel) {
            await channel.close();
            this.channels.delete(portId);
            
            if (this.defaultChannelId === portId) {
                this.defaultChannelId = this.channels.keys().next().value;
            }

            this.emit('channelRemoved', portId);
        }
    }

    /**
     * Send a message through a specific channel
     */
    public sendMessage(
        data: Buffer,
        portId?: string,
        priority: number = 1
    ): string | null {
        const channelId = portId || this.defaultChannelId;
        if (!channelId) {
            return null;
        }

        const channel = this.channels.get(channelId);
        if (!channel || channel.getState() !== CommunicationState.OPEN) {
            return null;
        }

        return channel.queueMessage(data, priority);
    }

    /**
     * Get channel statistics
     */
    public getChannelStatistics(portId: string): ChannelStatistics | undefined {
        return this.channels.get(portId)?.getStatistics();
    }

    /**
     * Get all channel statistics
     */
    public getAllChannelStatistics(): Map<string, ChannelStatistics> {
        const statistics = new Map<string, ChannelStatistics>();
        for (const [portId, channel] of this.channels) {
            statistics.set(portId, channel.getStatistics());
        }
        return statistics;
    }

    /**
     * Get channel state
     */
    public getChannelState(portId: string): CommunicationState | undefined {
        return this.channels.get(portId)?.getState();
    }

    /**
     * Get queue length for a channel
     */
    public getQueueLength(portId: string): number {
        return this.channels.get(portId)?.getQueueLength() || 0;
    }
} 