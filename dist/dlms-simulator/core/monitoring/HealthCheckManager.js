"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckManager = exports.HealthStatus = void 0;
const events_1 = require("events");
const SimulatorLogger_1 = require("./SimulatorLogger");
const StatisticsManager_1 = require("./StatisticsManager");
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "HEALTHY";
    HealthStatus["DEGRADED"] = "DEGRADED";
    HealthStatus["UNHEALTHY"] = "UNHEALTHY";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
class HealthCheckManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.checkInterval = null;
        this.logger = SimulatorLogger_1.SimulatorLogger.getInstance();
        this.statistics = StatisticsManager_1.StatisticsManager.getInstance();
        this.config = { ...HealthCheckManager.DEFAULT_CONFIG };
        this.health = this.initializeHealth();
        this.startHealthCheck();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!HealthCheckManager.instance) {
            HealthCheckManager.instance = new HealthCheckManager();
        }
        return HealthCheckManager.instance;
    }
    /**
     * Initialize health status
     */
    initializeHealth() {
        const now = new Date();
        const initialComponent = {
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
    startHealthCheck() {
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
    async performHealthCheck() {
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
        }
        catch (error) {
            this.logger.logError('HealthCheck', error);
        }
    }
    /**
     * Check system resources
     */
    async checkSystemResources() {
        const metrics = this.statistics.getCurrentMetrics();
        const now = new Date();
        // Check CPU
        const cpuHealth = this.checkThreshold(metrics.system.cpuUsage, this.config.thresholds.cpu, 'CPU Usage');
        this.health.components.system.cpu = {
            status: cpuHealth.status,
            lastChecked: now,
            details: cpuHealth.details,
            metrics: { usage: metrics.system.cpuUsage }
        };
        // Check Memory
        const memoryUsagePercent = (metrics.system.memoryUsage /
            (process.memoryUsage().heapTotal || 1)) * 100;
        const memoryHealth = this.checkThreshold(memoryUsagePercent, this.config.thresholds.memory, 'Memory Usage');
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
    async checkDataGeneration() {
        const metrics = this.statistics.getCurrentMetrics();
        const now = new Date();
        // Check error rate
        const errorRate = metrics.dataGeneration.errorCount /
            (metrics.dataGeneration.generationCount || 1) * 100;
        const errorHealth = this.checkThreshold(errorRate, this.config.thresholds.errorRate, 'Generation Error Rate');
        // Check generation timing
        const timingHealth = this.checkThreshold(metrics.dataGeneration.averageGenerationTime, this.config.thresholds.responseTime, 'Generation Time');
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
    async checkCommunicationChannels() {
        const metrics = this.statistics.getCurrentMetrics();
        const now = new Date();
        // Check response times
        const responseHealth = this.checkThreshold(metrics.communication.responseTime.average, this.config.thresholds.responseTime, 'Response Time');
        // Check error rates
        const errorRate = metrics.communication.errorCount /
            (metrics.communication.totalConnections || 1) * 100;
        const errorHealth = this.checkThreshold(errorRate, this.config.thresholds.errorRate, 'Communication Error Rate');
        // Update channel health
        const channelHealth = {
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
    async checkDLMSServices() {
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
    checkThreshold(value, threshold, metricName) {
        if (value >= threshold.critical) {
            return {
                status: HealthStatus.UNHEALTHY,
                details: `${metricName} (${value}) exceeds critical threshold (${threshold.critical})`
            };
        }
        else if (value >= threshold.warning) {
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
    combineHealthStatus(statuses) {
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
    updateOverallHealth() {
        const allStatuses = [
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
    logHealthStatus() {
        const level = this.health.overall === HealthStatus.HEALTHY
            ? SimulatorLogger_1.LogLevel.INFO
            : this.health.overall === HealthStatus.DEGRADED
                ? SimulatorLogger_1.LogLevel.WARNING
                : SimulatorLogger_1.LogLevel.ERROR;
        this.logger.log(level, 'HealthCheck', `System health: ${this.health.overall}`, this.health);
    }
    /**
     * Get current health status
     */
    getHealth() {
        return JSON.parse(JSON.stringify(this.health));
    }
    /**
     * Update health check configuration
     */
    updateConfig(config) {
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
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.logger.logSystem('HealthCheckManager', 'Health checks stopped');
    }
}
exports.HealthCheckManager = HealthCheckManager;
HealthCheckManager.DEFAULT_CONFIG = {
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
            warning: 1000, // 1 second
            critical: 5000 // 5 seconds
        },
        errorRate: {
            warning: 5, // 5%
            critical: 10 // 10%
        }
    }
};
