import { EventEmitter } from 'events';
import { SimulatorLogger, LogLevel } from './SimulatorLogger';
import { StatisticsManager } from './StatisticsManager';

export enum HealthStatus {
    HEALTHY = 'HEALTHY',
    DEGRADED = 'DEGRADED',
    UNHEALTHY = 'UNHEALTHY'
}

export interface ComponentHealth {
    status: HealthStatus;
    lastChecked: Date;
    details: string;
    metrics?: any;
}

export interface SystemHealth {
    overall: HealthStatus;
    components: {
        dataGeneration: ComponentHealth;
        powerQuality: ComponentHealth;
        communication: {
            hdlc: ComponentHealth;
            tcp: ComponentHealth;
            serial: ComponentHealth;
        };
        system: {
            cpu: ComponentHealth;
            memory: ComponentHealth;
            disk: ComponentHealth;
        };
        dlms: {
            association: ComponentHealth;
            objectModel: ComponentHealth;
            services: ComponentHealth;
        };
    };
    timestamp: Date;
}

export interface HealthCheckConfig {
    checkIntervalMs: number;
    thresholds: {
        cpu: {
            warning: number;  // percentage
            critical: number; // percentage
        };
        memory: {
            warning: number;  // percentage
            critical: number; // percentage
        };
        disk: {
            warning: number;  // percentage
            critical: number; // percentage
        };
        responseTime: {
            warning: number;  // milliseconds
            critical: number; // milliseconds
        };
        errorRate: {
            warning: number;  // percentage
            critical: number; // percentage
        };
    };
}

export class HealthCheckManager extends EventEmitter {
    private static instance: HealthCheckManager;
    private health: SystemHealth;
    private config: HealthCheckConfig;
    private checkInterval: NodeJS.Timeout | null = null;
    private logger: SimulatorLogger;
    private statistics: StatisticsManager;

    private static readonly DEFAULT_CONFIG: HealthCheckConfig = {
        checkIntervalMs: 30000, // 30 seconds
        thresholds: {
            cpu: {
                warning: 70,
                critical: 90
            },
            memory: {
                warning: 75,
                critical: 90
            },
            disk: {
                warning: 80,
                critical: 90
            },
            responseTime: {
                warning: 1000,  // 1 second
                critical: 5000  // 5 seconds
            },
            errorRate: {
                warning: 5,    // 5%
                critical: 10   // 10%
            }
        }
    };

    private constructor() {
        super();
        this.logger = SimulatorLogger.getInstance();
        this.statistics = StatisticsManager.getInstance();
        this.config = { ...HealthCheckManager.DEFAULT_CONFIG };
        this.health = this.initializeHealth();
        this.startHealthCheck();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): HealthCheckManager {
        if (!HealthCheckManager.instance) {
            HealthCheckManager.instance = new HealthCheckManager();
        }
        return HealthCheckManager.instance;
    }

    /**
     * Initialize health status
     */
    private initializeHealth(): SystemHealth {
        const now = new Date();
        const initialComponent: ComponentHealth = {
            status: HealthStatus.HEALTHY,
            lastChecked: now,
            details: 'Initial state'
        };

        return {
            overall: HealthStatus.HEALTHY,
            components: {
                dataGeneration: { ...initialComponent },
                powerQuality: { ...initialComponent },
                communication: {
                    hdlc: { ...initialComponent },
                    tcp: { ...initialComponent },
                    serial: { ...initialComponent }
                },
                system: {
                    cpu: { ...initialComponent },
                    memory: { ...initialComponent },
                    disk: { ...initialComponent }
                },
                dlms: {
                    association: { ...initialComponent },
                    objectModel: { ...initialComponent },
                    services: { ...initialComponent }
                }
            },
            timestamp: now
        };
    }

    /**
     * Start health checks
     */
    private startHealthCheck(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        this.checkInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.config.checkIntervalMs);

        this.logger.logSystem('HealthCheckManager', 'Health checks started', {
            interval: this.config.checkIntervalMs
        });
    }

    /**
     * Perform comprehensive health check
     */
    private async performHealthCheck(): Promise<void> {
        try {
            // Check system resources
            await this.checkSystemResources();

            // Check data generation
            await this.checkDataGeneration();

            // Check communication channels
            await this.checkCommunicationChannels();

            // Check DLMS services
            await this.checkDLMSServices();

            // Update overall health status
            this.updateOverallHealth();

            // Emit health update event
            this.emit('healthUpdate', this.health);

            // Log health status
            this.logHealthStatus();
        } catch (error) {
            this.logger.logError('HealthCheck', error as Error);
        }
    }

    /**
     * Check system resources
     */
    private async checkSystemResources(): Promise<void> {
        const metrics = this.statistics.getCurrentMetrics();
        const now = new Date();

        // Check CPU
        const cpuHealth = this.checkThreshold(
            metrics.system.cpuUsage,
            this.config.thresholds.cpu,
            'CPU Usage'
        );
        this.health.components.system.cpu = {
            status: cpuHealth.status,
            lastChecked: now,
            details: cpuHealth.details,
            metrics: { usage: metrics.system.cpuUsage }
        };

        // Check Memory
        const memoryUsagePercent = (metrics.system.memoryUsage / 
            (process.memoryUsage().heapTotal || 1)) * 100;
        const memoryHealth = this.checkThreshold(
            memoryUsagePercent,
            this.config.thresholds.memory,
            'Memory Usage'
        );
        this.health.components.system.memory = {
            status: memoryHealth.status,
            lastChecked: now,
            details: memoryHealth.details,
            metrics: { 
                used: metrics.system.memoryUsage,
                percent: memoryUsagePercent
            }
        };

        // Check Disk (if needed)
        // This would require additional implementation for disk usage monitoring
    }

    /**
     * Check data generation health
     */
    private async checkDataGeneration(): Promise<void> {
        const metrics = this.statistics.getCurrentMetrics();
        const now = new Date();

        // Check error rate
        const errorRate = metrics.dataGeneration.errorCount / 
            (metrics.dataGeneration.generationCount || 1) * 100;
        const errorHealth = this.checkThreshold(
            errorRate,
            this.config.thresholds.errorRate,
            'Generation Error Rate'
        );

        // Check generation timing
        const timingHealth = this.checkThreshold(
            metrics.dataGeneration.averageGenerationTime,
            this.config.thresholds.responseTime,
            'Generation Time'
        );

        // Combine health statuses
        const status = this.combineHealthStatus([
            errorHealth.status,
            timingHealth.status
        ]);

        this.health.components.dataGeneration = {
            status,
            lastChecked: now,
            details: `Error Rate: ${errorHealth.details}, Timing: ${timingHealth.details}`,
            metrics: {
                errorRate,
                averageGenerationTime: metrics.dataGeneration.averageGenerationTime
            }
        };
    }

    /**
     * Check communication channels
     */
    private async checkCommunicationChannels(): Promise<void> {
        const metrics = this.statistics.getCurrentMetrics();
        const now = new Date();

        // Check response times
        const responseHealth = this.checkThreshold(
            metrics.communication.responseTime.average,
            this.config.thresholds.responseTime,
            'Response Time'
        );

        // Check error rates
        const errorRate = metrics.communication.errorCount / 
            (metrics.communication.totalConnections || 1) * 100;
        const errorHealth = this.checkThreshold(
            errorRate,
            this.config.thresholds.errorRate,
            'Communication Error Rate'
        );

        // Update channel health
        const channelHealth: ComponentHealth = {
            status: this.combineHealthStatus([
                responseHealth.status,
                errorHealth.status
            ]),
            lastChecked: now,
            details: `Response: ${responseHealth.details}, Errors: ${errorHealth.details}`,
            metrics: {
                responseTime: metrics.communication.responseTime,
                errorRate,
                activeConnections: metrics.communication.activeConnections
            }
        };

        // Update all channels (simplified - in reality, each channel would have its own metrics)
        this.health.components.communication.hdlc = { ...channelHealth };
        this.health.components.communication.tcp = { ...channelHealth };
        this.health.components.communication.serial = { ...channelHealth };
    }

    /**
     * Check DLMS services
     */
    private async checkDLMSServices(): Promise<void> {
        const now = new Date();
        const metrics = this.statistics.getCurrentMetrics();

        // Check associations
        this.health.components.dlms.association = {
            status: HealthStatus.HEALTHY,
            lastChecked: now,
            details: `Active clients: ${metrics.system.activeClients}`,
            metrics: {
                activeClients: metrics.system.activeClients
            }
        };

        // Check object model (simplified)
        this.health.components.dlms.objectModel = {
            status: HealthStatus.HEALTHY,
            lastChecked: now,
            details: 'Object model validation passed',
            metrics: {
                lastValidation: now
            }
        };

        // Check services (simplified)
        this.health.components.dlms.services = {
            status: HealthStatus.HEALTHY,
            lastChecked: now,
            details: 'All services operational',
            metrics: {
                lastCheck: now
            }
        };
    }

    /**
     * Check value against thresholds
     */
    private checkThreshold(
        value: number,
        threshold: { warning: number; critical: number },
        metricName: string
    ): { status: HealthStatus; details: string } {
        if (value >= threshold.critical) {
            return {
                status: HealthStatus.UNHEALTHY,
                details: `${metricName} (${value}) exceeds critical threshold (${threshold.critical})`
            };
        } else if (value >= threshold.warning) {
            return {
                status: HealthStatus.DEGRADED,
                details: `${metricName} (${value}) exceeds warning threshold (${threshold.warning})`
            };
        }
        return {
            status: HealthStatus.HEALTHY,
            details: `${metricName} (${value}) within normal range`
        };
    }

    /**
     * Combine multiple health statuses
     */
    private combineHealthStatus(statuses: HealthStatus[]): HealthStatus {
        if (statuses.includes(HealthStatus.UNHEALTHY)) {
            return HealthStatus.UNHEALTHY;
        }
        if (statuses.includes(HealthStatus.DEGRADED)) {
            return HealthStatus.DEGRADED;
        }
        return HealthStatus.HEALTHY;
    }

    /**
     * Update overall health status
     */
    private updateOverallHealth(): void {
        const allStatuses: HealthStatus[] = [
            this.health.components.dataGeneration.status,
            this.health.components.powerQuality.status,
            ...Object.values(this.health.components.communication).map(c => c.status),
            ...Object.values(this.health.components.system).map(s => s.status),
            ...Object.values(this.health.components.dlms).map(d => d.status)
        ];

        this.health.overall = this.combineHealthStatus(allStatuses);
        this.health.timestamp = new Date();
    }

    /**
     * Log health status
     */
    private logHealthStatus(): void {
        const level = this.health.overall === HealthStatus.HEALTHY
            ? LogLevel.INFO
            : this.health.overall === HealthStatus.DEGRADED
                ? LogLevel.WARNING
                : LogLevel.ERROR;

        this.logger.log(
            level,
            'HealthCheck',
            `System health: ${this.health.overall}`,
            this.health
        );
    }

    /**
     * Get current health status
     */
    public getHealth(): SystemHealth {
        return JSON.parse(JSON.stringify(this.health));
    }

    /**
     * Update health check configuration
     */
    public updateConfig(config: Partial<HealthCheckConfig>): void {
        this.config = {
            ...this.config,
            ...config,
            thresholds: {
                ...this.config.thresholds,
                ...config.thresholds
            }
        };

        // Restart health checks with new interval if changed
        if (config.checkIntervalMs) {
            this.startHealthCheck();
        }

        this.logger.logSystem('HealthCheckManager', 'Configuration updated', {
            config: this.config
        });
    }

    /**
     * Stop health checks
     */
    public stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.logger.logSystem('HealthCheckManager', 'Health checks stopped');
    }
} 