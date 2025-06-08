"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationManager = exports.AssociationState = void 0;
const ObisCode_1 = require("../cosem/obis/ObisCode");
const Types_1 = require("../cosem/data/Types");
const AssociationLN_1 = require("../cosem/objects/AssociationLN");
var AssociationState;
(function (AssociationState) {
    AssociationState[AssociationState["INACTIVE"] = 0] = "INACTIVE";
    AssociationState[AssociationState["ASSOCIATION_PENDING"] = 1] = "ASSOCIATION_PENDING";
    AssociationState[AssociationState["ASSOCIATED"] = 2] = "ASSOCIATED";
    AssociationState[AssociationState["ASSOCIATION_RELEASE_PENDING"] = 3] = "ASSOCIATION_RELEASE_PENDING";
    AssociationState[AssociationState["FAILED"] = 4] = "FAILED";
})(AssociationState || (exports.AssociationState = AssociationState = {}));
/**
 * Association Manager Class
 * Handles client associations, active connections, and session management
 */
class AssociationManager {
    constructor() {
        this.activeSessions = new Map();
        this.clientAssociations = new Map();
        this.statistics = {
            totalAssociations: 0,
            activeAssociations: 0,
            failedAssociations: 0,
            averageSessionDuration: 0,
            authenticationFailures: 0
        };
        // Start session cleanup timer
        setInterval(() => this.cleanupInactiveSessions(), 60000); // Run every minute
    }
    /**
     * Create a new client association
     */
    createAssociation(clientId, authenticationType = Types_1.AuthenticationType.NONE, securityLevel = Types_1.SecurityLevel.NONE) {
        const logicalName = ObisCode_1.ObisCode.fromString('0.0.40.0.' + clientId + '.255');
        const association = new AssociationLN_1.AssociationLN(logicalName, clientId);
        this.clientAssociations.set(clientId, association);
        this.statistics.totalAssociations++;
        return association;
    }
    /**
     * Start a new client session
     */
    startSession(clientId, ipAddress, port, authenticationType, securityLevel) {
        // Check if maximum sessions limit is reached
        if (this.activeSessions.size >= AssociationManager.MAX_TOTAL_SESSIONS) {
            return null;
        }
        // Check if client has reached maximum sessions
        const clientSessions = Array.from(this.activeSessions.values())
            .filter(session => session.clientId === clientId);
        if (clientSessions.length >= AssociationManager.MAX_SESSIONS_PER_CLIENT) {
            return null;
        }
        const sessionId = this.generateSessionId();
        const session = {
            sessionId,
            clientId,
            startTime: new Date(),
            lastActivityTime: new Date(),
            state: AssociationState.ASSOCIATION_PENDING,
            authenticationType,
            securityLevel,
            ipAddress,
            port
        };
        this.activeSessions.set(sessionId, session);
        this.statistics.activeAssociations++;
        return session;
    }
    /**
     * Update session state
     */
    updateSessionState(sessionId, state) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.state = state;
            session.lastActivityTime = new Date();
            if (state === AssociationState.FAILED) {
                this.statistics.failedAssociations++;
                if (session.state === AssociationState.ASSOCIATION_PENDING) {
                    this.statistics.authenticationFailures++;
                }
                this.endSession(sessionId);
            }
        }
    }
    /**
     * End a client session
     */
    endSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            const duration = new Date().getTime() - session.startTime.getTime();
            this.updateAverageSessionDuration(duration);
            this.activeSessions.delete(sessionId);
            this.statistics.activeAssociations--;
        }
    }
    /**
     * Get active session by ID
     */
    getSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }
    /**
     * Get all active sessions for a client
     */
    getClientSessions(clientId) {
        return Array.from(this.activeSessions.values())
            .filter(session => session.clientId === clientId);
    }
    /**
     * Get association statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Clean up inactive sessions
     */
    cleanupInactiveSessions() {
        const now = new Date().getTime();
        for (const [sessionId, session] of this.activeSessions) {
            const inactiveTime = now - session.lastActivityTime.getTime();
            if (inactiveTime > AssociationManager.SESSION_TIMEOUT) {
                this.endSession(sessionId);
            }
        }
    }
    /**
     * Update average session duration
     */
    updateAverageSessionDuration(duration) {
        const totalSessions = this.statistics.totalAssociations;
        const currentAverage = this.statistics.averageSessionDuration;
        this.statistics.averageSessionDuration =
            (currentAverage * (totalSessions - 1) + duration) / totalSessions;
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
exports.AssociationManager = AssociationManager;
AssociationManager.SESSION_TIMEOUT = 300000; // 5 minutes in milliseconds
AssociationManager.MAX_SESSIONS_PER_CLIENT = 5;
AssociationManager.MAX_TOTAL_SESSIONS = 100;
