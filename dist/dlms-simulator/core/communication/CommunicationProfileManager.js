"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationProfileManager = exports.CommunicationState = exports.CommunicationChannelType = void 0;
const events_1 = require("events");
const HDLCLayer_1 = require("../dlms/transport/HDLCLayer");
var CommunicationChannelType;
(function (CommunicationChannelType) {
    CommunicationChannelType["HDLC_SERIAL"] = "HDLC_SERIAL";
    CommunicationChannelType["HDLC_TCP"] = "HDLC_TCP";
    CommunicationChannelType["WRAPPER"] = "WRAPPER";
    CommunicationChannelType["UDP"] = "UDP";
})(CommunicationChannelType || (exports.CommunicationChannelType = CommunicationChannelType = {}));
var CommunicationState;
(function (CommunicationState) {
    CommunicationState["CLOSED"] = "CLOSED";
    CommunicationState["OPENING"] = "OPENING";
    CommunicationState["OPEN"] = "OPEN";
    CommunicationState["CLOSING"] = "CLOSING";
    CommunicationState["ERROR"] = "ERROR";
})(CommunicationState || (exports.CommunicationState = CommunicationState = {}));
/**
 * Communication Channel Class
 * Manages individual communication channel
 */
class CommunicationChannel extends events_1.EventEmitter {
    constructor(config) {
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
            this.hdlcLayer = new HDLCLayer_1.HDLCLayer(config.hdlcConfig);
        }
    }
    /**
     * Open the communication channel
     */
    async open() {
        try {
            this.state = CommunicationState.OPENING;
            // Implementation depends on channel type
            // This is a placeholder for actual channel opening logic
            this.state = CommunicationState.OPEN;
            return true;
        }
        catch (error) {
            this.state = CommunicationState.ERROR;
            this.statistics.errors++;
            this.statistics.lastError = error instanceof Error ? error.message : 'Unknown error';
            return false;
        }
    }
    /**
     * Close the communication channel
     */
    async close() {
        this.state = CommunicationState.CLOSING;
        // Implementation depends on channel type
        // This is a placeholder for actual channel closing logic
        this.state = CommunicationState.CLOSED;
    }
    /**
     * Queue a message for sending
     */
    queueMessage(data, priority = 1) {
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const message = {
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
    async processQueue() {
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
            }
            else {
                // Direct send without HDLC
                // Actual send implementation would go here
                this.statistics.bytesSent += message.data.length;
                this.statistics.messagesSent++;
            }
            this.messageQueue.shift();
            this.statistics.lastActivity = new Date();
            this.emit('messageSent', message.id);
        }
        catch (error) {
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
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Get channel state
     */
    getState() {
        return this.state;
    }
    /**
     * Get queue length
     */
    getQueueLength() {
        return this.messageQueue.length;
    }
}
/**
 * Communication Profile Manager Class
 * Manages communication profiles and channels
 */
class CommunicationProfileManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.channels = new Map();
    }
    /**
     * Create a new communication channel
     */
    async createChannel(config) {
        try {
            const channel = new CommunicationChannel(config);
            this.channels.set(config.portId, channel);
            // Set as default if first channel
            if (!this.defaultChannelId) {
                this.defaultChannelId = config.portId;
            }
            // Forward channel events
            channel.on('messageSent', (messageId) => {
                this.emit('messageSent', config.portId, messageId);
            });
            channel.on('messageError', (messageId, error) => {
                this.emit('messageError', config.portId, messageId, error);
            });
            const success = await channel.open();
            if (success) {
                this.emit('channelCreated', config.portId);
            }
            return success;
        }
        catch (error) {
            this.emit('error', config.portId, error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    /**
     * Close and remove a communication channel
     */
    async removeChannel(portId) {
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
    sendMessage(data, portId, priority = 1) {
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
    getChannelStatistics(portId) {
        return this.channels.get(portId)?.getStatistics();
    }
    /**
     * Get all channel statistics
     */
    getAllChannelStatistics() {
        const statistics = new Map();
        for (const [portId, channel] of this.channels) {
            statistics.set(portId, channel.getStatistics());
        }
        return statistics;
    }
    /**
     * Get channel state
     */
    getChannelState(portId) {
        return this.channels.get(portId)?.getState();
    }
    /**
     * Get queue length for a channel
     */
    getQueueLength(portId) {
        return this.channels.get(portId)?.getQueueLength() || 0;
    }
}
exports.CommunicationProfileManager = CommunicationProfileManager;
