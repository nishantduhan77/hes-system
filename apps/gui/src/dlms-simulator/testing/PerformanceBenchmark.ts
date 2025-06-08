import { EventEmitter } from 'events';
import { SimulatorLogger } from '../core/monitoring/SimulatorLogger';
import { TestResult, TestType } from './TestFrameworkManager';

interface BenchmarkConfig {
    benchmarkType: string;
    iterations: number;
    warmup: number;
}

interface BenchmarkMetrics {
    operationsPerSecond: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    minLatency: number;
    maxLatency: number;
    totalTime: number;
    successRate: number;
}

export class PerformanceBenchmark extends EventEmitter {
    private logger: SimulatorLogger;
    private activeBenchmarks: Map<string, boolean>;
    private benchmarkTypes: Map<string, () => Promise<number>>;
    private results: Map<string, number[]>;

    constructor() {
        super();
        this.logger = SimulatorLogger.getInstance();
        this.activeBenchmarks = new Map();
        this.benchmarkTypes = new Map();
        this.results = new Map();
        this.initializeBenchmarks();
    }

    /**
     * Initialize benchmark types
     */
    private initializeBenchmarks(): void {
        // Data Generation Benchmarks
        this.benchmarkTypes.set('DATA_GENERATION', async () => {
            return await this.benchmarkDataGeneration();
        });

        // Communication Benchmarks
        this.benchmarkTypes.set('ASSOCIATION_TIME', async () => {
            return await this.benchmarkAssociation();
        });

        this.benchmarkTypes.set('GET_RESPONSE_TIME', async () => {
            return await this.benchmarkGetResponse();
        });

        // Encryption Benchmarks
        this.benchmarkTypes.set('ENCRYPTION_SPEED', async () => {
            return await this.benchmarkEncryption();
        });

        // Data Processing Benchmarks
        this.benchmarkTypes.set('DATA_PROCESSING', async () => {
            return await this.benchmarkDataProcessing();
        });
    }

    /**
     * Start benchmark
     */
    public async startBenchmark(testId: string, config: BenchmarkConfig): Promise<void> {
        this.validateConfig(config);
        this.activeBenchmarks.set(testId, true);
        this.results.set(testId, []);

        try {
            // Perform warmup
            this.logger.logSystem('PerformanceBenchmark', 'Starting warmup', {
                testId,
                warmupIterations: config.warmup
            });

            for (let i = 0; i < config.warmup; i++) {
                await this.runBenchmark(testId, config.benchmarkType);
            }

            // Clear warmup results
            this.results.set(testId, []);

            // Run actual benchmark
            this.logger.logSystem('PerformanceBenchmark', 'Starting benchmark', {
                testId,
                iterations: config.iterations
            });

            for (let i = 0; i < config.iterations; i++) {
                if (!this.activeBenchmarks.get(testId)) break;
                await this.runBenchmark(testId, config.benchmarkType);
            }

            this.completeBenchmark(testId);
        } catch (error) {
            this.logger.logError('PerformanceBenchmark', error as Error);
            this.activeBenchmarks.delete(testId);
            throw error;
        }
    }

    /**
     * Stop benchmark
     */
    public async stopBenchmark(testId: string): Promise<void> {
        if (this.activeBenchmarks.has(testId)) {
            this.activeBenchmarks.set(testId, false);
            this.completeBenchmark(testId);
        }
    }

    /**
     * Run a single benchmark iteration
     */
    private async runBenchmark(testId: string, benchmarkType: string): Promise<void> {
        const benchmarkFunc = this.benchmarkTypes.get(benchmarkType);
        if (!benchmarkFunc) {
            throw new Error(`Unknown benchmark type: ${benchmarkType}`);
        }

        try {
            const latency = await benchmarkFunc();
            const results = this.results.get(testId) || [];
            results.push(latency);
            this.results.set(testId, results);
        } catch (error) {
            this.logger.logError('PerformanceBenchmark', error as Error);
        }
    }

    /**
     * Complete benchmark and calculate metrics
     */
    private completeBenchmark(testId: string): void {
        const latencies = this.results.get(testId) || [];
        if (latencies.length === 0) return;

        // Sort latencies for percentile calculations
        latencies.sort((a, b) => a - b);

        const metrics: BenchmarkMetrics = {
            operationsPerSecond: 1000 / (latencies.reduce((a, b) => a + b) / latencies.length),
            averageLatency: latencies.reduce((a, b) => a + b) / latencies.length,
            p95Latency: latencies[Math.floor(latencies.length * 0.95)],
            p99Latency: latencies[Math.floor(latencies.length * 0.99)],
            minLatency: latencies[0],
            maxLatency: latencies[latencies.length - 1],
            totalTime: latencies.reduce((a, b) => a + b),
            successRate: (latencies.length / (latencies.length + 1)) * 100 // Assuming one error
        };

        const result: TestResult = {
            testId,
            testType: TestType.PERFORMANCE,
            startTime: new Date(Date.now() - metrics.totalTime),
            endTime: new Date(),
            success: metrics.successRate > 95,
            metrics,
            errors: [],
            details: {
                latencyDistribution: this.calculateLatencyDistribution(latencies)
            }
        };

        this.emit('testComplete', result);
        this.results.delete(testId);
        this.activeBenchmarks.delete(testId);
    }

    /**
     * Calculate latency distribution
     */
    private calculateLatencyDistribution(latencies: number[]): Record<string, number> {
        const distribution: Record<string, number> = {};
        const bucketSize = (latencies[latencies.length - 1] - latencies[0]) / 10;

        for (const latency of latencies) {
            const bucket = Math.floor(latency / bucketSize) * bucketSize;
            distribution[bucket] = (distribution[bucket] || 0) + 1;
        }

        return distribution;
    }

    /**
     * Validate benchmark configuration
     */
    private validateConfig(config: BenchmarkConfig): void {
        if (!config.benchmarkType) {
            throw new Error('Benchmark type must be specified');
        }
        if (!this.benchmarkTypes.has(config.benchmarkType)) {
            throw new Error(`Unknown benchmark type: ${config.benchmarkType}`);
        }
        if (config.iterations <= 0) {
            throw new Error('Iterations must be greater than 0');
        }
        if (config.warmup < 0) {
            throw new Error('Warmup iterations cannot be negative');
        }
    }

    // Benchmark Implementations

    private async benchmarkDataGeneration(): Promise<number> {
        const start = Date.now();
        // Simulate data generation operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return Date.now() - start;
    }

    private async benchmarkAssociation(): Promise<number> {
        const start = Date.now();
        // Simulate association operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        return Date.now() - start;
    }

    private async benchmarkGetResponse(): Promise<number> {
        const start = Date.now();
        // Simulate GET response operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
        return Date.now() - start;
    }

    private async benchmarkEncryption(): Promise<number> {
        const start = Date.now();
        // Simulate encryption operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return Date.now() - start;
    }

    private async benchmarkDataProcessing(): Promise<number> {
        const start = Date.now();
        // Simulate data processing operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
        return Date.now() - start;
    }
} 