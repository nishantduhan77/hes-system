"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsManager = void 0;
const events_1 = require("events");
const SimulatorLogger_1 = require("./SimulatorLogger");
class StatisticsManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.updateInterval = null;
        this.maxHistorySize = 1000;
        this.updateIntervalMs = 5000;
        this.logger = SimulatorLogger_1.SimulatorLogger.getInstance();
        this.history = [];
        this.metrics = this.initializeMetrics();
        this.startPeriodicUpdate();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!StatisticsManager.instance) {
            StatisticsManager.instance = new StatisticsManager();
        }
        return StatisticsManager.instance;
    }
    /**
     * Initialize metrics with default values
     */
    initializeMetrics() {
        const now = new Date();
        return {
            dataGeneration: {
                averageGenerationTime: 0,
                generationCount: 0,
                errorCount: 0,
                lastGenerationTime: now
            },
            powerQuality: {
                eventCount: {
                    sag: 0,
                    swell: 0,
                    interruption: 0,
                    harmonics: 0,
                    flicker: 0
                },
                lastEventTime: now
            },
            communication: {
                activeConnections: 0,
                totalConnections: 0,
                bytesReceived: 0,
                bytesSent: 0,
                errorCount: 0,
                lastActivityTime: now,
                responseTime: {
                    min: Number.MAX_VALUE,
                    max: 0,
                    average: 0
                }
            },
            system: {
                uptime: 0,
                cpuUsage: 0,
                memoryUsage: 0,
                activeClients: 0,
                lastUpdateTime: now
            }
        };
    }
    /**
     * Start periodic statistics update
     */
    startPeriodicUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => {
            this.updateSystemMetrics();
            this.saveSnapshot();
        }, this.updateIntervalMs);
    }
    /**
     * Update system metrics
     */
    updateSystemMetrics() {
        const process = require('process');
        // Update system metrics
        this.metrics.system.uptime = process.uptime();
        this.metrics.system.cpuUsage = process.cpuUsage().user / 1000000; // Convert to seconds
        this.metrics.system.memoryUsage = process.memoryUsage().heapUsed;
        this.metrics.system.lastUpdateTime = new Date();
        this.emit('metricsUpdate', this.metrics);
    }
    /**
     * Save current metrics snapshot
     */
    saveSnapshot() {
        const snapshot = {
            timestamp: new Date(),
            metrics: JSON.parse(JSON.stringify(this.metrics))
        };
        this.history.push(snapshot);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        this.logger.logSystem('StatisticsManager', 'Metrics snapshot saved', {
            timestamp: snapshot.timestamp
        });
    }
    /**
     * Record data generation metrics
     */
    recordDataGeneration(generationTime, success) {
        const metrics = this.metrics.dataGeneration;
        metrics.generationCount++;
        if (!success) {
            metrics.errorCount++;
        }
        // Update average generation time
        metrics.averageGenerationTime = ((metrics.averageGenerationTime * (metrics.generationCount - 1) + generationTime) /
            metrics.generationCount);
        metrics.lastGenerationTime = new Date();
    }
    /**
     * Record power quality event
     */
    recordPowerQualityEvent(eventType) {
        this.metrics.powerQuality.eventCount[eventType]++;
        this.metrics.powerQuality.lastEventTime = new Date();
    }
    /**
     * Record communication metrics
     */
    recordCommunication(bytesReceived, bytesSent, responseTime, isError = false) {
        const metrics = this.metrics.communication;
        metrics.bytesReceived += bytesReceived;
        metrics.bytesSent += bytesSent;
        metrics.lastActivityTime = new Date();
        if (isError) {
            metrics.errorCount++;
        }
        // Update response time metrics
        metrics.responseTime.min = Math.min(metrics.responseTime.min, responseTime);
        metrics.responseTime.max = Math.max(metrics.responseTime.max, responseTime);
        metrics.responseTime.average = ((metrics.responseTime.average * metrics.totalConnections + responseTime) /
            (metrics.totalConnections + 1));
    }
    /**
     * Update connection status
     */
    updateConnectionStatus(active) {
        if (active) {
            this.metrics.communication.activeConnections++;
            this.metrics.communication.totalConnections++;
            this.metrics.system.activeClients++;
        }
        else {
            this.metrics.communication.activeConnections--;
            this.metrics.system.activeClients--;
        }
    }
    /**
     * Get current metrics
     */
    getCurrentMetrics() {
        return JSON.parse(JSON.stringify(this.metrics));
    }
    /**
     * Get metrics history
     */
    getMetricsHistory(startTime, endTime) {
        let filteredHistory = this.history;
        if (startTime) {
            filteredHistory = filteredHistory.filter(snapshot => snapshot.timestamp >= startTime);
        }
        if (endTime) {
            filteredHistory = filteredHistory.filter(snapshot => snapshot.timestamp <= endTime);
        }
        return JSON.parse(JSON.stringify(filteredHistory));
    }
    /**
     * Get metrics summary
     */
    getMetricsSummary() {
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 3600000);
        const recentMetrics = this.getMetricsHistory(hourAgo, now);
        return {
            dataGeneration: {
                totalGenerated: this.metrics.dataGeneration.generationCount,
                errorRate: (this.metrics.dataGeneration.errorCount /
                    this.metrics.dataGeneration.generationCount) * 100,
                averageGenerationTime: this.metrics.dataGeneration.averageGenerationTime
            },
            powerQuality: {
                totalEvents: Object.values(this.metrics.powerQuality.eventCount)
                    .reduce((a, b) => a + b, 0),
                eventDistribution: { ...this.metrics.powerQuality.eventCount }
            },
            communication: {
                activeConnections: this.metrics.communication.activeConnections,
                throughput: {
                    received: this.metrics.communication.bytesReceived,
                    sent: this.metrics.communication.bytesSent
                },
                responseTime: { ...this.metrics.communication.responseTime },
                errorRate: (this.metrics.communication.errorCount /
                    this.metrics.communication.totalConnections) * 100
            },
            system: {
                uptime: this.metrics.system.uptime,
                cpuUsage: this.metrics.system.cpuUsage,
                memoryUsage: this.metrics.system.memoryUsage,
                activeClients: this.metrics.system.activeClients
            }
        };
    }
    /**
     * Reset statistics
     */
    resetStatistics() {
        this.metrics = this.initializeMetrics();
        this.history = [];
        this.logger.logSystem('StatisticsManager', 'Statistics reset');
        this.emit('statisticsReset');
    }
    /**
     * Stop statistics collection
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.logger.logSystem('StatisticsManager', 'Statistics collection stopped');
    }
}
exports.StatisticsManager = StatisticsManager;
