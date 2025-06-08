import { DlmsFrameType } from '../dlms/DlmsProtocol';
import { HDLCConfig } from '../dlms/transport/HDLCLayer';
import { AssociationState, ClientSession } from './AssociationManager';
import { SecurityLevel, AuthenticationType } from '../cosem/data/Types';

export interface ConnectionConfig {
    clientId: number;
    clientAddress: number;
    serverAddress: number;
    authenticationKey?: Buffer;
    encryptionKey?: Buffer;
    authenticationType: AuthenticationType;
    securityLevel: SecurityLevel;
    hdlcConfig: HDLCConfig;
}

export interface ConnectionState {
    connectionId: string;
    sessionId: string;
    config: ConnectionConfig;
    isConnected: boolean;
    lastFrameType: DlmsFrameType;
    lastActivityTime: Date;
    retryCount: number;
    bytesReceived: number;
    bytesSent: number;
    errorCount: number;
}

export interface ConnectionStatistics {
    totalConnections: number;
    activeConnections: number;
    failedConnections: number;
    totalBytesReceived: number;
    totalBytesSent: number;
    totalErrors: number;
}

/**
 * Connection Manager Class
 * Handles DLMS connections and their states
 */
export class ConnectionManager {
    private static readonly CONNECTION_TIMEOUT = 30000; // 30 seconds
    private static readonly MAX_RETRY_COUNT = 3;
    private static readonly CLEANUP_INTERVAL = 60000; // 1 minute

    private connections: Map<string, ConnectionState>;
    private statistics: ConnectionStatistics;

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
    public createConnection(
        sessionId: string,
        config: ConnectionConfig
    ): ConnectionState {
        const connectionId = this.generateConnectionId();
        const state: ConnectionState = {
            connectionId,
            sessionId,
            config,
            isConnected: false,
            lastFrameType: DlmsFrameType.SNRM,
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
    public updateConnectionState(
        connectionId: string,
        updates: Partial<ConnectionState>
    ): void {
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
                } else {
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
    public closeConnection(connectionId: string): void {
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
    public getConnection(connectionId: string): ConnectionState | undefined {
        return this.connections.get(connectionId);
    }

    /**
     * Get all connections for a session
     */
    public getSessionConnections(sessionId: string): ConnectionState[] {
        return Array.from(this.connections.values())
            .filter(conn => conn.sessionId === sessionId);
    }

    /**
     * Get connection statistics
     */
    public getStatistics(): ConnectionStatistics {
        return { ...this.statistics };
    }

    /**
     * Clean up inactive connections
     */
    private cleanupInactiveConnections(): void {
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
    private generateConnectionId(): string {
        return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
} 