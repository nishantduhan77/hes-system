"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterConnectionManager = void 0;
const events_1 = require("events");
const GprsCommunicator_1 = require("./gprs/GprsCommunicator");
const winston_1 = require("winston");
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    maxRetries: 3,
    maxConcurrentConnections: 1000,
    connectionTimeout: 30000,
    retryDelay: 5000
};
/**
 * Manages multiple meter connections
 */
class MeterConnectionManager extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.connections = new Map();
        this.communicators = new Map();
        // Initialize logger
        this.logger = (0, winston_1.createLogger)({
            level: 'info',
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
            transports: [
                new winston_1.transports.Console(),
                new winston_1.transports.File({ filename: 'meter-connections.log' })
            ]
        });
    }
    /**
     * Add a new meter connection
     */
    async addMeter(meterId, ipAddress, port) {
        if (this.connections.size >= this.config.maxConcurrentConnections) {
            throw new Error('Maximum number of concurrent connections reached');
        }
        const connection = {
            meterId,
            ipAddress,
            port,
            state: GprsCommunicator_1.GprsState.DISCONNECTED,
            retryCount: 0
        };
        this.connections.set(meterId, connection);
        const gprsConfig = {
            host: ipAddress,
            port,
            keepAliveInterval: 60000,
            reconnectInterval: this.config.retryDelay,
            simCardApn: 'internet',
            connectionTimeout: this.config.connectionTimeout
        };
        const communicator = new GprsCommunicator_1.GprsCommunicator(gprsConfig, this.logger);
        this.communicators.set(meterId, communicator);
        // Set up event handlers
        communicator.on('stateChange', (state) => {
            this.handleStateChange(meterId, state);
        });
        communicator.on('error', (error) => {
            this.handleError(meterId, error);
        });
        communicator.on('data', (data) => {
            this.handleData(meterId, data);
        });
        // Attempt initial connection
        try {
            await this.connect(meterId);
        }
        catch (error) {
            this.logger.error(`Failed to establish initial connection for meter ${meterId}:`, error);
        }
    }
    /**
     * Remove a meter connection
     */
    async removeMeter(meterId) {
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
    async connect(meterId) {
        const connection = this.connections.get(meterId);
        const communicator = this.communicators.get(meterId);
        if (!connection || !communicator) {
            throw new Error(`Meter ${meterId} not found`);
        }
        try {
            await communicator.connect();
            connection.lastConnected = new Date();
            connection.retryCount = 0;
        }
        catch (error) {
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
    async disconnect(meterId) {
        const communicator = this.communicators.get(meterId);
        if (communicator) {
            await communicator.disconnect();
        }
    }
    /**
     * Send data to a specific meter
     */
    async sendToMeter(meterId, data) {
        const communicator = this.communicators.get(meterId);
        if (!communicator) {
            throw new Error(`Meter ${meterId} not found`);
        }
        try {
            await communicator.send(data);
        }
        catch (error) {
            this.logger.error(`Error sending data to meter ${meterId}:`, error);
            throw error;
        }
    }
    /**
     * Handle state changes
     */
    handleStateChange(meterId, state) {
        const connection = this.connections.get(meterId);
        if (connection) {
            connection.state = state;
            if (state === GprsCommunicator_1.GprsState.DISCONNECTED) {
                connection.lastDisconnected = new Date();
            }
            else if (state === GprsCommunicator_1.GprsState.CONNECTED) {
                connection.lastConnected = new Date();
            }
        }
        this.emit('stateChange', { meterId, state });
    }
    /**
     * Handle connection errors
     */
    handleError(meterId, error) {
        this.logger.error(`Error in meter ${meterId}:`, error);
        this.emit('error', { meterId, error });
    }
    /**
     * Handle incoming data
     */
    handleData(meterId, data) {
        this.emit('data', { meterId, data });
    }
    /**
     * Get connection status for a meter
     */
    getConnectionStatus(meterId) {
        return this.connections.get(meterId);
    }
    /**
     * Get all active connections
     */
    getActiveConnections() {
        return Array.from(this.connections.values())
            .filter(conn => conn.state === GprsCommunicator_1.GprsState.CONNECTED);
    }
    /**
     * Get connection statistics
     */
    getStatistics() {
        const connections = Array.from(this.connections.values());
        return {
            total: connections.length,
            active: connections.filter(c => c.state === GprsCommunicator_1.GprsState.CONNECTED).length,
            disconnected: connections.filter(c => c.state === GprsCommunicator_1.GprsState.DISCONNECTED).length,
            error: connections.filter(c => c.state === GprsCommunicator_1.GprsState.ERROR).length
        };
    }
}
exports.MeterConnectionManager = MeterConnectionManager;
