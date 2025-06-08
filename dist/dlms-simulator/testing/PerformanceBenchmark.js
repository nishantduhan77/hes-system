"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceBenchmark = void 0;
const events_1 = require("events");
const SimulatorLogger_1 = require("../core/monitoring/SimulatorLogger");
const TestFrameworkManager_1 = require("./TestFrameworkManager");
class PerformanceBenchmark extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = SimulatorLogger_1.SimulatorLogger.getInstance();
        this.activeBenchmarks = new Map();
        this.benchmarkTypes = new Map();
        this.results = new Map();
        this.initializeBenchmarks();
    }
    /**
     * Initialize benchmark types
     */
    initializeBenchmarks() {
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
    async startBenchmark(testId, config) {
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
                if (!this.activeBenchmarks.get(testId))
                    break;
                await this.runBenchmark(testId, config.benchmarkType);
            }
            this.completeBenchmark(testId);
        }
        catch (error) {
            this.logger.logError('PerformanceBenchmark', error);
            this.activeBenchmarks.delete(testId);
            throw error;
        }
    }
    /**
     * Stop benchmark
     */
    async stopBenchmark(testId) {
        if (this.activeBenchmarks.has(testId)) {
            this.activeBenchmarks.set(testId, false);
            this.completeBenchmark(testId);
        }
    }
    /**
     * Run a single benchmark iteration
     */
    async runBenchmark(testId, benchmarkType) {
        const benchmarkFunc = this.benchmarkTypes.get(benchmarkType);
        if (!benchmarkFunc) {
            throw new Error(`Unknown benchmark type: ${benchmarkType}`);
        }
        try {
            const latency = await benchmarkFunc();
            const results = this.results.get(testId) || [];
            results.push(latency);
            this.results.set(testId, results);
        }
        catch (error) {
            this.logger.logError('PerformanceBenchmark', error);
        }
    }
    /**
     * Complete benchmark and calculate metrics
     */
    completeBenchmark(testId) {
        const latencies = this.results.get(testId) || [];
        if (latencies.length === 0)
            return;
        // Sort latencies for percentile calculations
        latencies.sort((a, b) => a - b);
        const metrics = {
            operationsPerSecond: 1000 / (latencies.reduce((a, b) => a + b) / latencies.length),
            averageLatency: latencies.reduce((a, b) => a + b) / latencies.length,
            p95Latency: latencies[Math.floor(latencies.length * 0.95)],
            p99Latency: latencies[Math.floor(latencies.length * 0.99)],
            minLatency: latencies[0],
            maxLatency: latencies[latencies.length - 1],
            totalTime: latencies.reduce((a, b) => a + b),
            successRate: (latencies.length / (latencies.length + 1)) * 100 // Assuming one error
        };
        const result = {
            testId,
            testType: TestFrameworkManager_1.TestType.PERFORMANCE,
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
    calculateLatencyDistribution(latencies) {
        const distribution = {};
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
    validateConfig(config) {
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
    async benchmarkDataGeneration() {
        const start = Date.now();
        // Simulate data generation operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return Date.now() - start;
    }
    async benchmarkAssociation() {
        const start = Date.now();
        // Simulate association operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        return Date.now() - start;
    }
    async benchmarkGetResponse() {
        const start = Date.now();
        // Simulate GET response operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
        return Date.now() - start;
    }
    async benchmarkEncryption() {
        const start = Date.now();
        // Simulate encryption operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return Date.now() - start;
    }
    async benchmarkDataProcessing() {
        const start = Date.now();
        // Simulate data processing operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
        return Date.now() - start;
    }
}
exports.PerformanceBenchmark = PerformanceBenchmark;
