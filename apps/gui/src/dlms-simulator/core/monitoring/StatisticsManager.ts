import { EventEmitter } from 'events';
import { SimulatorLogger } from './SimulatorLogger';

export interface PerformanceMetrics {
    dataGeneration: {
        averageGenerationTime: number;  // in milliseconds
        generationCount: number;
        errorCount: number;
        lastGenerationTime: Date;
    };
    powerQuality: {
        eventCount: {
            sag: number;
            swell: number;
            interruption: number;
            harmonics: number;
            flicker: number;
        };
        lastEventTime: Date;
    };
    communication: {
        activeConnections: number;
        totalConnections: number;
        bytesReceived: number;
        bytesSent: number;
        errorCount: number;
        lastActivityTime: Date;
        responseTime: {
            min: number;
            max: number;
            average: number;
        };
    };
    system: {
        uptime: number;          // in seconds
        cpuUsage: number;        // percentage
        memoryUsage: number;     // in bytes
        activeClients: number;
        lastUpdateTime: Date;
    };
}

export interface StatisticsSnapshot {
    timestamp: Date;
    metrics: PerformanceMetrics;
}

export class StatisticsManager extends EventEmitter {
    private static instance: StatisticsManager;
    private metrics: PerformanceMetrics;
    private history: StatisticsSnapshot[];
    private updateInterval: NodeJS.Timeout | null = null;
    private logger: SimulatorLogger;
    private readonly maxHistorySize: number = 1000;
    private readonly updateIntervalMs: number = 5000;

    private constructor() {
        super();
        this.logger = SimulatorLogger.getInstance();
        this.history = [];
        this.metrics = this.initializeMetrics();
        this.startPeriodicUpdate();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): StatisticsManager {
        if (!StatisticsManager.instance) {
            StatisticsManager.instance = new StatisticsManager();
        }
        return StatisticsManager.instance;
    }

    /**
     * Initialize metrics with default values
     */
    private initializeMetrics(): PerformanceMetrics {
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
    private startPeriodicUpdate(): void {
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
    private updateSystemMetrics(): void {
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
    private saveSnapshot(): void {
        const snapshot: StatisticsSnapshot = {
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
    public recordDataGeneration(generationTime: number, success: boolean): void {
        const metrics = this.metrics.dataGeneration;
        metrics.generationCount++;
        
        if (!success) {
            metrics.errorCount++;
        }

        // Update average generation time
        metrics.averageGenerationTime = (
            (metrics.averageGenerationTime * (metrics.generationCount - 1) + generationTime) /
            metrics.generationCount
        );
        
        metrics.lastGenerationTime = new Date();
    }

    /**
     * Record power quality event
     */
    public recordPowerQualityEvent(eventType: keyof PerformanceMetrics['powerQuality']['eventCount']): void {
        this.metrics.powerQuality.eventCount[eventType]++;
        this.metrics.powerQuality.lastEventTime = new Date();
    }

    /**
     * Record communication metrics
     */
    public recordCommunication(
        bytesReceived: number,
        bytesSent: number,
        responseTime: number,
        isError: boolean = false
    ): void {
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
        metrics.responseTime.average = (
            (metrics.responseTime.average * metrics.totalConnections + responseTime) /
            (metrics.totalConnections + 1)
        );
    }

    /**
     * Update connection status
     */
    public updateConnectionStatus(active: boolean): void {
        if (active) {
            this.metrics.communication.activeConnections++;
            this.metrics.communication.totalConnections++;
            this.metrics.system.activeClients++;
        } else {
            this.metrics.communication.activeConnections--;
            this.metrics.system.activeClients--;
        }
    }

    /**
     * Get current metrics
     */
    public getCurrentMetrics(): PerformanceMetrics {
        return JSON.parse(JSON.stringify(this.metrics));
    }

    /**
     * Get metrics history
     */
    public getMetricsHistory(
        startTime?: Date,
        endTime?: Date
    ): StatisticsSnapshot[] {
        let filteredHistory = this.history;

        if (startTime) {
            filteredHistory = filteredHistory.filter(
                snapshot => snapshot.timestamp >= startTime
            );
        }

        if (endTime) {
            filteredHistory = filteredHistory.filter(
                snapshot => snapshot.timestamp <= endTime
            );
        }

        return JSON.parse(JSON.stringify(filteredHistory));
    }

    /**
     * Get metrics summary
     */
    public getMetricsSummary(): any {
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 3600000);
        const recentMetrics = this.getMetricsHistory(hourAgo, now);

        return {
            dataGeneration: {
                totalGenerated: this.metrics.dataGeneration.generationCount,
                errorRate: (
                    this.metrics.dataGeneration.errorCount /
                    this.metrics.dataGeneration.generationCount
                ) * 100,
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
                errorRate: (
                    this.metrics.communication.errorCount /
                    this.metrics.communication.totalConnections
                ) * 100
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
    public resetStatistics(): void {
        this.metrics = this.initializeMetrics();
        this.history = [];
        this.logger.logSystem('StatisticsManager', 'Statistics reset');
        this.emit('statisticsReset');
    }

    /**
     * Stop statistics collection
     */
    public stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.logger.logSystem('StatisticsManager', 'Statistics collection stopped');
    }
} 