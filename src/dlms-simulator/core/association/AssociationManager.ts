import { ObisCode } from '../cosem/obis/ObisCode';
import { AuthenticationType, SecurityLevel } from '../cosem/data/Types';
import { AssociationLN } from '../cosem/objects/AssociationLN';

export enum AssociationState {
    INACTIVE = 0,
    ASSOCIATION_PENDING = 1,
    ASSOCIATED = 2,
    ASSOCIATION_RELEASE_PENDING = 3,
    FAILED = 4
}

export interface ClientSession {
    sessionId: string;
    clientId: number;
    startTime: Date;
    lastActivityTime: Date;
    state: AssociationState;
    authenticationType: AuthenticationType;
    securityLevel: SecurityLevel;
    ipAddress: string;
    port: number;
}

export interface AssociationStatistics {
    totalAssociations: number;
    activeAssociations: number;
    failedAssociations: number;
    averageSessionDuration: number;
    authenticationFailures: number;
}

/**
 * Association Manager Class
 * Handles client associations, active connections, and session management
 */
export class AssociationManager {
    private static readonly SESSION_TIMEOUT = 300000; // 5 minutes in milliseconds
    private static readonly MAX_SESSIONS_PER_CLIENT = 5;
    private static readonly MAX_TOTAL_SESSIONS = 100;

    private activeSessions: Map<string, ClientSession>;
    private clientAssociations: Map<number, AssociationLN>;
    private statistics: AssociationStatistics;

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
    public createAssociation(
        clientId: number,
        authenticationType: AuthenticationType = AuthenticationType.NONE,
        securityLevel: SecurityLevel = SecurityLevel.NONE
    ): AssociationLN {
        const logicalName = ObisCode.fromString('0.0.40.0.' + clientId + '.255');
        const association = new AssociationLN(logicalName, clientId);
        
        this.clientAssociations.set(clientId, association);
        this.statistics.totalAssociations++;
        
        return association;
    }

    /**
     * Start a new client session
     */
    public startSession(
        clientId: number,
        ipAddress: string,
        port: number,
        authenticationType: AuthenticationType,
        securityLevel: SecurityLevel
    ): ClientSession | null {
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
        const session: ClientSession = {
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
    public updateSessionState(sessionId: string, state: AssociationState): void {
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
    public endSession(sessionId: string): void {
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
    public getSession(sessionId: string): ClientSession | undefined {
        return this.activeSessions.get(sessionId);
    }

    /**
     * Get all active sessions for a client
     */
    public getClientSessions(clientId: number): ClientSession[] {
        return Array.from(this.activeSessions.values())
            .filter(session => session.clientId === clientId);
    }

    /**
     * Get association statistics
     */
    public getStatistics(): AssociationStatistics {
        return { ...this.statistics };
    }

    /**
     * Clean up inactive sessions
     */
    private cleanupInactiveSessions(): void {
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
    private updateAverageSessionDuration(duration: number): void {
        const totalSessions = this.statistics.totalAssociations;
        const currentAverage = this.statistics.averageSessionDuration;
        this.statistics.averageSessionDuration = 
            (currentAverage * (totalSessions - 1) + duration) / totalSessions;
    }

    /**
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
} 