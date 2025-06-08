"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDLCTcpChannel = void 0;
const net_1 = require("net");
const events_1 = require("events");
const HDLCLayer_1 = require("../../dlms/transport/HDLCLayer");
const CommunicationProfileManager_1 = require("../CommunicationProfileManager");
/**
 * HDLC TCP Channel Class
 * Implements TCP-based HDLC communication
 */
class HDLCTcpChannel extends events_1.EventEmitter {
    constructor(config) {
        super();
        if (!config.hdlcConfig) {
            throw new Error('HDLC configuration is required for HDLC TCP channel');
        }
        this.config = config;
        this.hdlcLayer = new HDLCLayer_1.HDLCLayer(config.hdlcConfig);
        this.socket = new net_1.Socket();
        this.state = CommunicationProfileManager_1.CommunicationState.CLOSED;
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
    setupSocketHandlers() {
        this.socket.on('connect', () => {
            this.state = CommunicationProfileManager_1.CommunicationState.OPEN;
            this.emit('connected');
        });
        this.socket.on('close', () => {
            this.state = CommunicationProfileManager_1.CommunicationState.CLOSED;
            this.emit('disconnected');
            this.scheduleReconnect();
        });
        this.socket.on('error', (error) => {
            this.statistics.errors++;
            this.statistics.lastError = error.message;
            this.emit('error', error);
        });
        this.socket.on('data', (data) => {
            this.handleData(data);
        });
    }
    /**
     * Handle received data
     */
    handleData(data) {
        this.statistics.bytesReceived += data.length;
        this.statistics.lastActivity = new Date();
        // Append received data to buffer
        this.buffer = Buffer.concat([this.buffer, data]);
        // Process complete frames
        let frame;
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
    async open() {
        if (this.state === CommunicationProfileManager_1.CommunicationState.OPEN) {
            return true;
        }
        return new Promise((resolve) => {
            this.state = CommunicationProfileManager_1.CommunicationState.OPENING;
            const connectTimeout = setTimeout(() => {
                this.socket.removeAllListeners('connect');
                this.socket.removeAllListeners('error');
                this.state = CommunicationProfileManager_1.CommunicationState.ERROR;
                resolve(false);
            }, 10000); // 10 seconds timeout
            this.socket.once('connect', () => {
                clearTimeout(connectTimeout);
                this.state = CommunicationProfileManager_1.CommunicationState.OPEN;
                resolve(true);
            });
            this.socket.once('error', () => {
                clearTimeout(connectTimeout);
                this.state = CommunicationProfileManager_1.CommunicationState.ERROR;
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
    async close() {
        return new Promise((resolve) => {
            if (this.state === CommunicationProfileManager_1.CommunicationState.CLOSED) {
                resolve();
                return;
            }
            this.state = CommunicationProfileManager_1.CommunicationState.CLOSING;
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = undefined;
            }
            this.socket.once('close', () => {
                this.state = CommunicationProfileManager_1.CommunicationState.CLOSED;
                resolve();
            });
            this.socket.end();
        });
    }
    /**
     * Send data through the channel
     */
    async send(data) {
        if (this.state !== CommunicationProfileManager_1.CommunicationState.OPEN) {
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
                    }
                    else {
                        this.statistics.bytesSent += frame.length;
                        this.statistics.messagesSent++;
                        this.statistics.lastActivity = new Date();
                        resolve(true);
                    }
                });
            });
        }
        catch (error) {
            this.statistics.errors++;
            this.statistics.lastError = error instanceof Error ? error.message : 'Unknown error';
            return false;
        }
    }
    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(async () => {
            if (this.state === CommunicationProfileManager_1.CommunicationState.CLOSED) {
                await this.open();
            }
        }, HDLCTcpChannel.RECONNECT_INTERVAL);
    }
    /**
     * Get channel state
     */
    getState() {
        return this.state;
    }
    /**
     * Get channel statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
}
exports.HDLCTcpChannel = HDLCTcpChannel;
HDLCTcpChannel.RECONNECT_INTERVAL = 5000; // 5 seconds
