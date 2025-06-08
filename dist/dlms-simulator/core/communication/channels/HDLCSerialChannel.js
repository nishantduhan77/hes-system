"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDLCSerialChannel = void 0;
const events_1 = require("events");
const serialport_1 = require("serialport");
const HDLCLayer_1 = require("../../dlms/transport/HDLCLayer");
const CommunicationProfileManager_1 = require("../CommunicationProfileManager");
/**
 * HDLC Serial Channel Class
 * Implements serial port-based HDLC communication
 */
class HDLCSerialChannel extends events_1.EventEmitter {
    constructor(config) {
        super();
        if (!config.hdlcConfig) {
            throw new Error('HDLC configuration is required for HDLC serial channel');
        }
        this.config = config;
        this.hdlcLayer = new HDLCLayer_1.HDLCLayer(config.hdlcConfig);
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
        const { baudRate = 9600, dataBits = 8, stopBits = 1, parity = 'none', flowControl = false } = config.parameters;
        this.port = new serialport_1.SerialPort({
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
    setupPortHandlers() {
        this.port.on('open', () => {
            this.state = CommunicationProfileManager_1.CommunicationState.OPEN;
            this.emit('connected');
        });
        this.port.on('close', () => {
            this.state = CommunicationProfileManager_1.CommunicationState.CLOSED;
            this.emit('disconnected');
            this.scheduleReconnect();
        });
        this.port.on('error', (error) => {
            this.statistics.errors++;
            this.statistics.lastError = error.message;
            this.emit('error', error);
        });
        this.port.on('data', (data) => {
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
            const openTimeout = setTimeout(() => {
                this.port.removeAllListeners('open');
                this.port.removeAllListeners('error');
                this.state = CommunicationProfileManager_1.CommunicationState.ERROR;
                resolve(false);
            }, 10000); // 10 seconds timeout
            this.port.once('open', () => {
                clearTimeout(openTimeout);
                this.state = CommunicationProfileManager_1.CommunicationState.OPEN;
                resolve(true);
            });
            this.port.once('error', () => {
                clearTimeout(openTimeout);
                this.state = CommunicationProfileManager_1.CommunicationState.ERROR;
                resolve(false);
            });
            this.port.open();
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
            this.port.once('close', () => {
                this.state = CommunicationProfileManager_1.CommunicationState.CLOSED;
                resolve();
            });
            this.port.close();
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
                this.port.write(frame, (error) => {
                    if (error) {
                        this.statistics.errors++;
                        this.statistics.lastError = error.message;
                        resolve(false);
                    }
                    else {
                        this.port.drain(() => {
                            this.statistics.bytesSent += frame.length;
                            this.statistics.messagesSent++;
                            this.statistics.lastActivity = new Date();
                            resolve(true);
                        });
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
        }, HDLCSerialChannel.RECONNECT_INTERVAL);
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
exports.HDLCSerialChannel = HDLCSerialChannel;
HDLCSerialChannel.RECONNECT_INTERVAL = 5000; // 5 seconds
