"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationService = void 0;
const AssociationManager_1 = require("./AssociationManager");
const ConnectionManager_1 = require("./ConnectionManager");
const events_1 = require("events");
/**
 * Association Service Class
 * Coordinates association and connection management
 */
class AssociationService extends events_1.EventEmitter {
    constructor() {
        super();
        this.associationManager = new AssociationManager_1.AssociationManager();
        this.connectionManager = new ConnectionManager_1.ConnectionManager();
    }
    /**
     * Handle association request
     */
    async handleAssociationRequest(request) {
        try {
            // Start client session
            const session = this.associationManager.startSession(request.clientId, request.ipAddress, request.port, request.authenticationType, request.securityLevel);
            if (!session) {
                return {
                    success: false,
                    error: 'Failed to create session. Maximum sessions limit reached.'
                };
            }
            // Create connection configuration
            const connectionConfig = {
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
            const connection = this.connectionManager.createConnection(session.sessionId, connectionConfig);
            // Create association
            const association = this.associationManager.createAssociation(request.clientId, request.authenticationType, request.securityLevel);
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    /**
     * Handle association release
     */
    async releaseAssociation(sessionId) {
        try {
            // Get session
            const session = this.associationManager.getSession(sessionId);
            if (!session) {
                return false;
            }
            // Update session state
            this.associationManager.updateSessionState(sessionId, AssociationManager_1.AssociationState.ASSOCIATION_RELEASE_PENDING);
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
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Handle connection state update
     */
    updateConnectionState(connectionId, isConnected, error) {
        const connection = this.connectionManager.getConnection(connectionId);
        if (connection) {
            // Update connection state
            this.connectionManager.updateConnectionState(connectionId, {
                isConnected,
                errorCount: error ? connection.errorCount + 1 : connection.errorCount
            });
            // Update session state if connection failed
            if (!isConnected && error) {
                this.associationManager.updateSessionState(connection.sessionId, AssociationManager_1.AssociationState.FAILED);
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
    getSessionInfo(sessionId) {
        return {
            session: this.associationManager.getSession(sessionId),
            connections: this.connectionManager.getSessionConnections(sessionId)
        };
    }
    /**
     * Get statistics
     */
    getStatistics() {
        return {
            associations: this.associationManager.getStatistics(),
            connections: this.connectionManager.getStatistics()
        };
    }
}
exports.AssociationService = AssociationService;
