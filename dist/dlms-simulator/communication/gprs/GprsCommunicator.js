"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GprsCommunicator = exports.GprsState = void 0;
const net_1 = require("net");
const events_1 = require("events");
/**
 * Default GPRS configuration
 */
const DEFAULT_CONFIG = {
    host: 'localhost',
    port: 4059, // Default DLMS/COSEM port
    keepAliveInterval: 60000, // 1 minute
    reconnectInterval: 30000, // 30 seconds
    simCardApn: 'internet', // Default APN
    connectionTimeout: 30000 // 30 seconds
};
/**
 * GPRS Connection States
 */
var GprsState;
(function (GprsState) {
    GprsState["DISCONNECTED"] = "DISCONNECTED";
    GprsState["CONNECTING"] = "CONNECTING";
    GprsState["CONNECTED"] = "CONNECTED";
    GprsState["AUTHENTICATING"] = "AUTHENTICATING";
    GprsState["READY"] = "READY";
    GprsState["ERROR"] = "ERROR";
})(GprsState || (exports.GprsState = GprsState = {}));
/**
 * GPRS Communication Handler
 * Implements communication over GPRS for smart meters
 */
class GprsCommunicator extends events_1.EventEmitter {
    constructor(config, logger) {
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
    async connect() {
        if (this.state === GprsState.CONNECTING || this.state === GprsState.CONNECTED) {
            return;
        }
        this.setState(GprsState.CONNECTING);
        this.socket = new net_1.Socket();
        return new Promise((resolve, reject) => {
            const connectTimeout = setTimeout(() => {
                this.handleError(new Error('Connection timeout'));
                reject(new Error('Connection timeout'));
            }, this.config.connectionTimeout);
            this.socket.on('connect', () => {
                clearTimeout(connectTimeout);
                this.setState(GprsState.CONNECTED);
                this.setupKeepAlive();
                this.logger.info(`GPRS connection established to ${this.config.host}:${this.config.port}`);
                resolve();
            });
            this.socket.on('data', this.handleData);
            this.socket.on('error', this.handleError);
            this.socket.on('close', () => {
                this.handleDisconnect();
                this.scheduleReconnect();
            });
            this.socket.connect({
                host: this.config.host,
                port: this.config.port
            });
        });
    }
    /**
     * Disconnect from the meter
     */
    disconnect() {
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
    send(data) {
        return new Promise((resolve, reject) => {
            if (!this.socket || this.state !== GprsState.CONNECTED) {
                reject(new Error('Not connected'));
                return;
            }
            this.socket.write(data, (error) => {
                if (error) {
                    this.logger.error('Error sending data:', error);
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Handle incoming data
     */
    handleData(data) {
        this.buffer = Buffer.concat([this.buffer, data]);
        // Process DLMS frames
        // TODO: Implement DLMS frame parsing
        this.emit('data', data);
    }
    /**
     * Handle connection errors
     */
    handleError(error) {
        this.logger.error('GPRS connection error:', error);
        this.setState(GprsState.ERROR);
        this.emit('error', error);
    }
    /**
     * Handle disconnection
     */
    handleDisconnect() {
        this.logger.info('GPRS connection closed');
        this.setState(GprsState.DISCONNECTED);
        this.clearTimers();
        this.emit('disconnect');
    }
    /**
     * Set up keep-alive mechanism
     */
    setupKeepAlive() {
        if (this.keepAliveTimer) {
            clearInterval(this.keepAliveTimer);
        }
        this.keepAliveTimer = setInterval(this.sendKeepAlive, this.config.keepAliveInterval);
    }
    /**
     * Send keep-alive message
     */
    async sendKeepAlive() {
        try {
            // TODO: Implement proper keep-alive frame according to your protocol
            const keepAliveFrame = Buffer.from([0x00]); // Placeholder
            await this.send(keepAliveFrame);
            this.logger.debug('Keep-alive sent');
        }
        catch (error) {
            this.logger.error('Failed to send keep-alive:', error);
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
            try {
                await this.connect();
            }
            catch (error) {
                this.logger.error('Reconnection failed:', error);
            }
        }, this.config.reconnectInterval);
    }
    /**
     * Clear all timers
     */
    clearTimers() {
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
    setState(state) {
        this.state = state;
        this.emit('stateChange', state);
    }
    /**
     * Get current connection state
     */
    getState() {
        return this.state;
    }
    /**
     * Get connection info
     */
    getConnectionInfo() {
        return {
            host: this.config.host,
            port: this.config.port,
            state: this.state
        };
    }
}
exports.GprsCommunicator = GprsCommunicator;
