import { EventEmitter } from 'events';
import { SimulatorLogger } from '../core/monitoring/SimulatorLogger';
import { TestResult, TestType } from './TestFrameworkManager';

interface LoadTestConfig {
    concurrent: number;
    duration: number;
    rampUp: number;
    operations: string[];
}

interface LoadTestMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
}

export class LoadTester extends EventEmitter {
    private logger: SimulatorLogger;
    private activeTests: Map<string, NodeJS.Timeout>;
    private metrics: Map<string, LoadTestMetrics>;
    private operations: Map<string, () => Promise<void>>;

    constructor() {
        super();
        this.logger = SimulatorLogger.getInstance();
        this.activeTests = new Map();
        this.metrics = new Map();
        this.operations = new Map();
        this.initializeOperations();
    }

    /**
     * Initialize test operations
     */
    private initializeOperations(): void {
        // Add standard DLMS operations
        this.operations.set('GET_REQUEST', async () => {
            // Simulate GET request
            await this.simulateOperation(100, 500);
        });

        this.operations.set('SET_REQUEST', async () => {
            // Simulate SET request
            await this.simulateOperation(200, 800);
        });

        this.operations.set('ACTION_REQUEST', async () => {
            // Simulate ACTION request
            await this.simulateOperation(300, 1000);
        });

        this.operations.set('ASSOCIATION_REQUEST', async () => {
            // Simulate association request
            await this.simulateOperation(500, 2000);
        });
    }

    /**
     * Start a load test
     */
    public async startTest(testId: string, config: LoadTestConfig): Promise<void> {
        this.validateConfig(config);
        this.initializeMetrics(testId);

        const workerCount = config.concurrent;
        const rampUpDelay = (config.rampUp * 1000) / workerCount;
        
        // Start workers with ramp-up delay
        for (let i = 0; i < workerCount; i++) {
            setTimeout(() => {
                this.startWorker(testId, config);
            }, i * rampUpDelay);
        }

        // Set test timeout
        const timeout = setTimeout(() => {
            this.stopTest(testId);
        }, config.duration * 1000);

        this.activeTests.set(testId, timeout);
    }

    /**
     * Stop a load test
     */
    public async stopTest(testId: string): Promise<void> {
        const timeout = this.activeTests.get(testId);
        if (timeout) {
            clearTimeout(timeout);
            this.activeTests.delete(testId);
            this.completeTest(testId);
        }
    }

    /**
     * Start a worker process
     */
    private async startWorker(testId: string, config: LoadTestConfig): Promise<void> {
        while (this.activeTests.has(testId)) {
            for (const operation of config.operations) {
                if (!this.activeTests.has(testId)) break;

                const operationFunc = this.operations.get(operation);
                if (!operationFunc) {
                    this.logger.logError('LoadTester', `Unknown operation: ${operation}`);
                    continue;
                }

                const startTime = Date.now();
                try {
                    await operationFunc();
                    this.updateMetrics(testId, true, Date.now() - startTime);
                } catch (error) {
                    this.updateMetrics(testId, false, Date.now() - startTime);
                    this.logger.logError('LoadTester', error as Error);
                }
            }
        }
    }

    /**
     * Initialize metrics for a test
     */
    private initializeMetrics(testId: string): void {
        this.metrics.set(testId, {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: Number.MAX_VALUE,
            requestsPerSecond: 0,
            errorRate: 0
        });
    }

    /**
     * Update test metrics
     */
    private updateMetrics(testId: string, success: boolean, responseTime: number): void {
        const metrics = this.metrics.get(testId);
        if (!metrics) return;

        metrics.totalRequests++;
        if (success) {
            metrics.successfulRequests++;
        } else {
            metrics.failedRequests++;
        }

        metrics.averageResponseTime = (
            (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) /
            metrics.totalRequests
        );
        metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
        metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
        metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
        metrics.requestsPerSecond = metrics.totalRequests / (Date.now() / 1000);
    }

    /**
     * Complete a test and emit results
     */
    private completeTest(testId: string): void {
        const metrics = this.metrics.get(testId);
        if (!metrics) return;

        const result: TestResult = {
            testId,
            testType: TestType.LOAD,
            startTime: new Date(Date.now() - 3600000), // Approximate start time
            endTime: new Date(),
            success: metrics.errorRate < 5, // Consider test successful if error rate < 5%
            metrics: {
                totalRequests: metrics.totalRequests,
                successfulRequests: metrics.successfulRequests,
                failedRequests: metrics.failedRequests,
                averageResponseTime: metrics.averageResponseTime,
                maxResponseTime: metrics.maxResponseTime,
                minResponseTime: metrics.minResponseTime,
                requestsPerSecond: metrics.requestsPerSecond,
                errorRate: metrics.errorRate
            },
            errors: [],
            details: {}
        };

        this.emit('testComplete', result);
        this.metrics.delete(testId);
    }

    /**
     * Validate test configuration
     */
    private validateConfig(config: LoadTestConfig): void {
        if (config.concurrent <= 0) {
            throw new Error('Concurrent users must be greater than 0');
        }
        if (config.duration <= 0) {
            throw new Error('Test duration must be greater than 0');
        }
        if (config.rampUp < 0) {
            throw new Error('Ramp-up period cannot be negative');
        }
        if (config.operations.length === 0) {
            throw new Error('At least one operation must be specified');
        }
        for (const operation of config.operations) {
            if (!this.operations.has(operation)) {
                throw new Error(`Unknown operation: ${operation}`);
            }
        }
    }

    /**
     * Simulate an operation with random response time
     */
    private async simulateOperation(minTime: number, maxTime: number): Promise<void> {
        const responseTime = Math.random() * (maxTime - minTime) + minTime;
        await new Promise(resolve => setTimeout(resolve, responseTime));
        
        // Simulate random errors
        if (Math.random() < 0.05) { // 5% error rate
            throw new Error('Simulated operation error');
        }
    }
} 