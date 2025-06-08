"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const DlmsProtocol_1 = require("../dlms/DlmsProtocol");
/**
 * Connection Manager Class
 * Handles DLMS connections and their states
 */
class ConnectionManager {
    constructor() {
        this.connections = new Map();
        this.statistics = {
            totalConnections: 0,
            activeConnections: 0,
            failedConnections: 0,
            totalBytesReceived: 0,
            totalBytesSent: 0,
            totalErrors: 0
        };
        // Start connection cleanup timer
        setInterval(() => this.cleanupInactiveConnections(), ConnectionManager.CLEANUP_INTERVAL);
    }
    /**
     * Create a new connection
     */
    createConnection(sessionId, config) {
        const connectionId = this.generateConnectionId();
        const state = {
            connectionId,
            sessionId,
            config,
            isConnected: false,
            lastFrameType: DlmsProtocol_1.DlmsFrameType.SNRM,
            lastActivityTime: new Date(),
            retryCount: 0,
            bytesReceived: 0,
            bytesSent: 0,
            errorCount: 0
        };
        this.connections.set(connectionId, state);
        this.statistics.totalConnections++;
        return state;
    }
    /**
     * Update connection state
     */
    updateConnectionState(connectionId, updates) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            Object.assign(connection, updates);
            connection.lastActivityTime = new Date();
            // Update statistics
            if (updates.bytesReceived) {
                this.statistics.totalBytesReceived += updates.bytesReceived;
            }
            if (updates.bytesSent) {
                this.statistics.totalBytesSent += updates.bytesSent;
            }
            if (updates.errorCount) {
                this.statistics.totalErrors += updates.errorCount;
            }
            // Handle connection state changes
            if (updates.isConnected !== undefined) {
                if (updates.isConnected) {
                    this.statistics.activeConnections++;
                }
                else {
                    this.statistics.activeConnections--;
                    if (connection.retryCount >= ConnectionManager.MAX_RETRY_COUNT) {
                        this.statistics.failedConnections++;
                    }
                }
            }
        }
    }
    /**
     * Close a connection
     */
    closeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            if (connection.isConnected) {
                this.statistics.activeConnections--;
            }
            this.connections.delete(connectionId);
        }
    }
    /**
     * Get connection by ID
     */
    getConnection(connectionId) {
        return this.connections.get(connectionId);
    }
    /**
     * Get all connections for a session
     */
    getSessionConnections(sessionId) {
        return Array.from(this.connections.values())
            .filter(conn => conn.sessionId === sessionId);
    }
    /**
     * Get connection statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Clean up inactive connections
     */
    cleanupInactiveConnections() {
        const now = new Date().getTime();
        for (const [connectionId, connection] of this.connections) {
            const inactiveTime = now - connection.lastActivityTime.getTime();
            if (inactiveTime > ConnectionManager.CONNECTION_TIMEOUT) {
                this.closeConnection(connectionId);
            }
        }
    }
    /**
     * Generate a unique connection ID
     */
    generateConnectionId() {
        return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
exports.ConnectionManager = ConnectionManager;
ConnectionManager.CONNECTION_TIMEOUT = 30000; // 30 seconds
ConnectionManager.MAX_RETRY_COUNT = 3;
ConnectionManager.CLEANUP_INTERVAL = 60000; // 1 minute
