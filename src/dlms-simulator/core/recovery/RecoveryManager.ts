import { EventEmitter } from 'events';
import { SimulatorLogger } from '../monitoring/SimulatorLogger';
import { NotificationManager } from '../notifications/NotificationManager';

export enum SystemState {
    HEALTHY = 'HEALTHY',
    DEGRADED = 'DEGRADED',
    CRITICAL = 'CRITICAL',
    RECOVERING = 'RECOVERING',
    FAILED = 'FAILED'
}

export enum ComponentType {
    COMMUNICATION = 'COMMUNICATION',
    DATA_GENERATION = 'DATA_GENERATION',
    SECURITY = 'SECURITY',
    PERSISTENCE = 'PERSISTENCE',
    MONITORING = 'MONITORING'
}

export interface SystemError {
    id: string;
    timestamp: Date;
    componentType: ComponentType;
    errorType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    details: Record<string, any>;
    recoveryAttempts: number;
    resolved: boolean;
    resolutionTime?: Date;
}

export interface RecoveryProcedure {
    id: string;
    errorType: string;
    maxAttempts: number;
    backoffStrategy: 'LINEAR' | 'EXPONENTIAL';
    steps: RecoveryStep[];
    fallbackProcedure?: string;
}

interface RecoveryStep {
    action: () => Promise<boolean>;
    description: string;
    timeout: number;
}

export class RecoveryManager extends EventEmitter {
    private static instance: RecoveryManager;
    private logger: SimulatorLogger;
    private notificationManager: NotificationManager;
    private activeErrors: Map<string, SystemError>;
    private recoveryProcedures: Map<string, RecoveryProcedure>;
    private componentStates: Map<ComponentType, SystemState>;
    private recoveryAttempts: Map<string, number>;
    private recoveryInProgress: Set<string>;

    private constructor() {
        super();
        this.logger = SimulatorLogger.getInstance();
        this.notificationManager = NotificationManager.getInstance();
        this.activeErrors = new Map();
        this.recoveryProcedures = new Map();
        this.componentStates = new Map();
        this.recoveryAttempts = new Map();
        this.recoveryInProgress = new Set();

        this.initializeComponentStates();
        this.initializeRecoveryProcedures();
    }

    public static getInstance(): RecoveryManager {
        if (!RecoveryManager.instance) {
            RecoveryManager.instance = new RecoveryManager();
        }
        return RecoveryManager.instance;
    }

    /**
     * Initialize component states
     */
    private initializeComponentStates(): void {
        Object.values(ComponentType).forEach(component => {
            this.componentStates.set(component, SystemState.HEALTHY);
        });
    }

    /**
     * Initialize recovery procedures
     */
    private initializeRecoveryProcedures(): void {
        // Communication Recovery Procedures
        this.recoveryProcedures.set('CONNECTION_LOST', {
            id: 'CONNECTION_LOST',
            errorType: 'CONNECTION_ERROR',
            maxAttempts: 5,
            backoffStrategy: 'EXPONENTIAL',
            steps: [
                {
                    description: 'Close existing connection',
                    action: async () => {
                        // Implementation
                        return true;
                    },
                    timeout: 5000
                },
                {
                    description: 'Reinitialize connection',
                    action: async () => {
                        // Implementation
                        return true;
                    },
                    timeout: 10000
                }
            ]
        });

        // Data Generation Recovery Procedures
        this.recoveryProcedures.set('DATA_CORRUPTION', {
            id: 'DATA_CORRUPTION',
            errorType: 'DATA_ERROR',
            maxAttempts: 3,
            backoffStrategy: 'LINEAR',
            steps: [
                {
                    description: 'Validate data integrity',
                    action: async () => {
                        // Implementation
                        return true;
                    },
                    timeout: 5000
                },
                {
                    description: 'Regenerate corrupted data',
                    action: async () => {
                        // Implementation
                        return true;
                    },
                    timeout: 15000
                }
            ]
        });
    }

    /**
     * Report system error
     */
    public async reportError(
        componentType: ComponentType,
        errorType: string,
        message: string,
        details: Record<string, any>
    ): Promise<string> {
        const errorId = this.generateErrorId();
        const error: SystemError = {
            id: errorId,
            timestamp: new Date(),
            componentType,
            errorType,
            severity: this.determineSeverity(errorType),
            message,
            details,
            recoveryAttempts: 0,
            resolved: false
        };

        this.activeErrors.set(errorId, error);
        this.updateComponentState(componentType, error.severity);
        this.notifyError(error);

        // Start automatic recovery if procedure exists
        const procedure = this.recoveryProcedures.get(errorType);
        if (procedure) {
            this.startRecovery(errorId, procedure);
        }

        return errorId;
    }

    /**
     * Start recovery procedure
     */
    private async startRecovery(errorId: string, procedure: RecoveryProcedure): Promise<void> {
        if (this.recoveryInProgress.has(errorId)) return;

        const error = this.activeErrors.get(errorId);
        if (!error || error.resolved) return;

        this.recoveryInProgress.add(errorId);
        const attempts = this.recoveryAttempts.get(errorId) || 0;

        try {
            if (attempts < procedure.maxAttempts) {
                this.logger.logSystem('RecoveryManager', 'Starting recovery', {
                    errorId,
                    attempt: attempts + 1,
                    procedure: procedure.id
                });

                const delay = this.calculateBackoff(procedure.backoffStrategy, attempts);
                await new Promise(resolve => setTimeout(resolve, delay));

                for (const step of procedure.steps) {
                    const success = await this.executeRecoveryStep(step);
                    if (!success) {
                        throw new Error(`Recovery step failed: ${step.description}`);
                    }
                }

                // Recovery successful
                await this.resolveError(errorId);
            } else if (procedure.fallbackProcedure) {
                const fallback = this.recoveryProcedures.get(procedure.fallbackProcedure);
                if (fallback) {
                    await this.startRecovery(errorId, fallback);
                }
            } else {
                this.escalateError(error);
            }
        } catch (error) {
            this.logger.logError('RecoveryManager', error as Error);
            this.recoveryAttempts.set(errorId, attempts + 1);
        } finally {
            this.recoveryInProgress.delete(errorId);
        }
    }

    /**
     * Execute recovery step with timeout
     */
    private async executeRecoveryStep(step: RecoveryStep): Promise<boolean> {
        try {
            const result = await Promise.race([
                step.action(),
                new Promise<boolean>((_, reject) => 
                    setTimeout(() => reject(new Error('Step timeout')), step.timeout)
                )
            ]);
            return result;
        } catch (error) {
            this.logger.logError('RecoveryManager', error as Error);
            return false;
        }
    }

    /**
     * Calculate backoff delay
     */
    private calculateBackoff(strategy: 'LINEAR' | 'EXPONENTIAL', attempt: number): number {
        const baseDelay = 1000; // 1 second
        if (strategy === 'LINEAR') {
            return baseDelay * (attempt + 1);
        } else {
            return baseDelay * Math.pow(2, attempt);
        }
    }

    /**
     * Resolve error
     */
    private async resolveError(errorId: string): Promise<void> {
        const error = this.activeErrors.get(errorId);
        if (!error) return;

        error.resolved = true;
        error.resolutionTime = new Date();
        
        this.notificationManager.notifyRecovery(error);
        this.emit('errorResolved', error);
        this.logger.logSystem('RecoveryManager', 'Error resolved', {
            errorId,
            component: error.componentType,
            resolutionTime: error.resolutionTime
        });

        // Update component state if no other active errors
        const activeComponentErrors = Array.from(this.activeErrors.values())
            .filter(e => e.componentType === error.componentType && !e.resolved);
        
        if (activeComponentErrors.length === 0) {
            this.componentStates.set(error.componentType, SystemState.HEALTHY);
            this.emit('componentRecovered', error.componentType);
        }
    }

    /**
     * Escalate error
     */
    private escalateError(error: SystemError): void {
        this.componentStates.set(error.componentType, SystemState.CRITICAL);
        this.notificationManager.notifyError({
            ...error,
            severity: 'CRITICAL',
            message: `Error escalated after ${error.recoveryAttempts} failed recovery attempts`
        });
        this.emit('errorEscalated', error);
        this.logger.logSystem('RecoveryManager', 'Error escalated', {
            errorId: error.id,
            component: error.componentType,
            attempts: error.recoveryAttempts
        });
    }

    /**
     * Update component state based on error severity
     */
    private updateComponentState(component: ComponentType, severity: SystemError['severity']): void {
        const currentState = this.componentStates.get(component) || SystemState.HEALTHY;
        let newState = currentState;

        switch (severity) {
            case 'LOW':
                if (currentState === SystemState.HEALTHY) {
                    newState = SystemState.DEGRADED;
                }
                break;
            case 'MEDIUM':
                newState = SystemState.DEGRADED;
                break;
            case 'HIGH':
            case 'CRITICAL':
                newState = SystemState.CRITICAL;
                break;
        }

        if (newState !== currentState) {
            this.componentStates.set(component, newState);
            this.notificationManager.notifyStateChange(component, currentState, newState);
            this.emit('componentStateChanged', { component, oldState: currentState, newState });
        }
    }

    /**
     * Determine error severity
     */
    private determineSeverity(errorType: string): SystemError['severity'] {
        const severityMap: Record<string, SystemError['severity']> = {
            'CONNECTION_ERROR': 'HIGH',
            'DATA_ERROR': 'MEDIUM',
            'SECURITY_ERROR': 'CRITICAL',
            'PERSISTENCE_ERROR': 'HIGH',
            'CONFIGURATION_ERROR': 'MEDIUM',
            'VALIDATION_ERROR': 'LOW'
        };

        return severityMap[errorType] || 'MEDIUM';
    }

    /**
     * Notify about error
     */
    private notifyError(error: SystemError): void {
        this.emit('errorDetected', error);
        this.notificationManager.notifyError(error);
        this.logger.logSystem('RecoveryManager', 'Error detected', {
            errorId: error.id,
            component: error.componentType,
            type: error.errorType,
            severity: error.severity
        });
    }

    /**
     * Generate unique error ID
     */
    private generateErrorId(): string {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get active errors
     */
    public getActiveErrors(): SystemError[] {
        return Array.from(this.activeErrors.values())
            .filter(error => !error.resolved);
    }

    /**
     * Get component state
     */
    public getComponentState(component: ComponentType): SystemState {
        return this.componentStates.get(component) || SystemState.HEALTHY;
    }

    /**
     * Get system health status
     */
    public getSystemHealth(): Record<ComponentType, SystemState> {
        const health: Record<ComponentType, SystemState> = {} as Record<ComponentType, SystemState>;
        this.componentStates.forEach((state, component) => {
            health[component] = state;
        });
        return health;
    }

    /**
     * Register recovery procedure
     */
    public registerRecoveryProcedure(procedure: RecoveryProcedure): void {
        this.recoveryProcedures.set(procedure.id, procedure);
    }
} 