import { AssociationManager, AssociationState, ClientSession } from './AssociationManager';
import { ConnectionManager, ConnectionConfig, ConnectionState } from './ConnectionManager';
import { SecurityLevel, AuthenticationType } from '../cosem/data/Types';
import { HDLCConfig } from '../dlms/transport/HDLCLayer';
import { EventEmitter } from 'events';

export interface AssociationRequest {
    clientId: number;
    ipAddress: string;
    port: number;
    authenticationType: AuthenticationType;
    securityLevel: SecurityLevel;
    authenticationKey?: Buffer;
    encryptionKey?: Buffer;
    hdlcConfig: HDLCConfig;
}

export interface AssociationResponse {
    success: boolean;
    sessionId?: string;
    connectionId?: string;
    error?: string;
}

/**
 * Association Service Class
 * Coordinates association and connection management
 */
export class AssociationService extends EventEmitter {
    private associationManager: AssociationManager;
    private connectionManager: ConnectionManager;

    constructor() {
        super();
        this.associationManager = new AssociationManager();
        this.connectionManager = new ConnectionManager();
    }

    /**
     * Handle association request
     */
    public async handleAssociationRequest(
        request: AssociationRequest
    ): Promise<AssociationResponse> {
        try {
            // Start client session
            const session = this.associationManager.startSession(
                request.clientId,
                request.ipAddress,
                request.port,
                request.authenticationType,
                request.securityLevel
            );

            if (!session) {
                return {
                    success: false,
                    error: 'Failed to create session. Maximum sessions limit reached.'
                };
            }

            // Create connection configuration
            const connectionConfig: ConnectionConfig = {
                clientId: request.clientId,
                clientAddress: request.hdlcConfig.clientAddress.lowerAddress,
                serverAddress: request.hdlcConfig.serverAddress.lowerAddress,
                authenticationKey: request.authenticationKey,
                encryptionKey: request.encryptionKey,
                authenticationType: request.authenticationType,
                securityLevel: request.securityLevel,
                hdlcConfig: request.hdlcConfig
            };

            // Create connection
            const connection = this.connectionManager.createConnection(
                session.sessionId,
                connectionConfig
            );

            // Create association
            const association = this.associationManager.createAssociation(
                request.clientId,
                request.authenticationType,
                request.securityLevel
            );

            // Emit association event
            this.emit('association:created', {
                sessionId: session.sessionId,
                connectionId: connection.connectionId,
                association
            });

            return {
                success: true,
                sessionId: session.sessionId,
                connectionId: connection.connectionId
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Handle association release
     */
    public async releaseAssociation(sessionId: string): Promise<boolean> {
        try {
            // Get session
            const session = this.associationManager.getSession(sessionId);
            if (!session) {
                return false;
            }

            // Update session state
            this.associationManager.updateSessionState(
                sessionId,
                AssociationState.ASSOCIATION_RELEASE_PENDING
            );

            // Close all connections for this session
            const connections = this.connectionManager.getSessionConnections(sessionId);
            for (const connection of connections) {
                this.connectionManager.closeConnection(connection.connectionId);
            }

            // End session
            this.associationManager.endSession(sessionId);

            // Emit release event
            this.emit('association:released', { sessionId });

            return true;

        } catch (error) {
            return false;
        }
    }

    /**
     * Handle connection state update
     */
    public updateConnectionState(
        connectionId: string,
        isConnected: boolean,
        error?: string
    ): void {
        const connection = this.connectionManager.getConnection(connectionId);
        if (connection) {
            // Update connection state
            this.connectionManager.updateConnectionState(connectionId, {
                isConnected,
                errorCount: error ? connection.errorCount + 1 : connection.errorCount
            });

            // Update session state if connection failed
            if (!isConnected && error) {
                this.associationManager.updateSessionState(
                    connection.sessionId,
                    AssociationState.FAILED
                );
                
                // Emit failure event
                this.emit('association:failed', {
                    sessionId: connection.sessionId,
                    connectionId,
                    error
                });
            }
        }
    }

    /**
     * Get session information
     */
    public getSessionInfo(sessionId: string): {
        session: ClientSession | undefined,
        connections: ConnectionState[]
    } {
        return {
            session: this.associationManager.getSession(sessionId),
            connections: this.connectionManager.getSessionConnections(sessionId)
        };
    }

    /**
     * Get statistics
     */
    public getStatistics(): {
        associations: any,
        connections: any
    } {
        return {
            associations: this.associationManager.getStatistics(),
            connections: this.connectionManager.getStatistics()
        };
    }
} 