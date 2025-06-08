import { EventEmitter } from 'events';
import { SimulatorLogger } from '../monitoring/SimulatorLogger';
import { StatisticsSnapshot } from '../monitoring/StatisticsManager';
import { PowerQualityEvent } from '../data/DataGenerationManager';
import { SystemHealth } from '../monitoring/HealthCheckManager';
import { SimulatorConfig } from '../config/ConfigurationManager';
import * as fs from 'fs';
import * as path from 'path';
import { createGzip } from 'zlib';

export interface StorageConfig {
    basePath: string;
    retentionPeriod: {
        metrics: number;      // days
        events: number;       // days
        logs: number;         // days
        backups: number;      // days
    };
    compressionEnabled: boolean;
    autoBackupInterval: number; // hours
    maxFileSize: number;        // bytes
}

export interface DataRecord {
    timestamp: Date;
    type: string;
    data: any;
}

export class DataPersistenceManager extends EventEmitter {
    private static instance: DataPersistenceManager;
    private config: StorageConfig;
    private logger: SimulatorLogger;
    private backupInterval: NodeJS.Timeout | null = null;
    private currentFiles: Map<string, string> = new Map();

    private static readonly DEFAULT_CONFIG: StorageConfig = {
        basePath: './data',
        retentionPeriod: {
            metrics: 90,   // 90 days
            events: 180,   // 180 days
            logs: 30,      // 30 days
            backups: 7     // 7 days
        },
        compressionEnabled: true,
        autoBackupInterval: 24, // 24 hours
        maxFileSize: 100 * 1024 * 1024 // 100MB
    };

    private constructor() {
        super();
        this.logger = SimulatorLogger.getInstance();
        this.config = { ...DataPersistenceManager.DEFAULT_CONFIG };
        this.initializeStorage();
        this.startAutoBackup();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): DataPersistenceManager {
        if (!DataPersistenceManager.instance) {
            DataPersistenceManager.instance = new DataPersistenceManager();
        }
        return DataPersistenceManager.instance;
    }

    /**
     * Initialize storage structure
     */
    private initializeStorage(): void {
        try {
            const directories = [
                'metrics',
                'events',
                'logs',
                'backups',
                'generated_data'
            ];

            // Create base directory if it doesn't exist
            if (!fs.existsSync(this.config.basePath)) {
                fs.mkdirSync(this.config.basePath, { recursive: true });
            }

            // Create subdirectories
            for (const dir of directories) {
                const dirPath = path.join(this.config.basePath, dir);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            }

            this.logger.logSystem('DataPersistenceManager', 'Storage initialized', {
                basePath: this.config.basePath
            });
        } catch (error) {
            this.logger.logError('DataPersistenceManager', error as Error);
            throw error;
        }
    }

    /**
     * Start auto-backup process
     */
    private startAutoBackup(): void {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }

        this.backupInterval = setInterval(() => {
            this.createBackup();
        }, this.config.autoBackupInterval * 60 * 60 * 1000);

        this.logger.logSystem('DataPersistenceManager', 'Auto-backup started', {
            interval: this.config.autoBackupInterval
        });
    }

    /**
     * Store generated data
     */
    public async storeGeneratedData(data: any): Promise<void> {
        const record: DataRecord = {
            timestamp: new Date(),
            type: 'generated_data',
            data
        };

        await this.writeToFile(
            'generated_data',
            'data',
            record
        );
    }

    /**
     * Store power quality event
     */
    public async storePowerQualityEvent(event: PowerQualityEvent): Promise<void> {
        const record: DataRecord = {
            timestamp: new Date(),
            type: 'power_quality_event',
            data: event
        };

        await this.writeToFile(
            'events',
            'power_quality',
            record
        );
    }

    /**
     * Store metrics snapshot
     */
    public async storeMetrics(metrics: StatisticsSnapshot): Promise<void> {
        const record: DataRecord = {
            timestamp: new Date(),
            type: 'metrics',
            data: metrics
        };

        await this.writeToFile(
            'metrics',
            'statistics',
            record
        );
    }

    /**
     * Store health check results
     */
    public async storeHealthCheck(health: SystemHealth): Promise<void> {
        const record: DataRecord = {
            timestamp: new Date(),
            type: 'health_check',
            data: health
        };

        await this.writeToFile(
            'metrics',
            'health',
            record
        );
    }

    /**
     * Write data to file
     */
    private async writeToFile(
        directory: string,
        prefix: string,
        data: DataRecord
    ): Promise<void> {
        try {
            const date = new Date();
            const fileName = `${prefix}_${date.getFullYear()}${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}.json`;
            const filePath = path.join(this.config.basePath, directory, fileName);

            // Check if file exists and its size
            let fileContent: DataRecord[] = [];
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (stats.size >= this.config.maxFileSize) {
                    // Archive the file and start a new one
                    await this.archiveFile(filePath);
                    fileContent = [];
                } else {
                    fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
            }

            // Add new record and write to file
            fileContent.push(data);
            fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));

            this.currentFiles.set(`${directory}_${prefix}`, filePath);
            this.emit('dataSaved', { directory, prefix, data });
        } catch (error) {
            this.logger.logError('DataPersistenceManager', error as Error);
            throw error;
        }
    }

    /**
     * Archive a file using compression
     */
    private async archiveFile(filePath: string): Promise<void> {
        try {
            const archivePath = `${filePath}.gz`;
            const readStream = fs.createReadStream(filePath);
            const writeStream = fs.createWriteStream(archivePath);
            const gzip = createGzip();

            await new Promise((resolve, reject) => {
                readStream
                    .pipe(gzip)
                    .pipe(writeStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            // Delete original file after successful compression
            fs.unlinkSync(filePath);

            this.logger.logSystem('DataPersistenceManager', 'File archived', {
                original: filePath,
                archive: archivePath
            });
        } catch (error) {
            this.logger.logError('DataPersistenceManager', error as Error);
            throw error;
        }
    }

    /**
     * Create system backup
     */
    public async createBackup(): Promise<void> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(this.config.basePath, 'backups', timestamp);

            // Create backup directory
            fs.mkdirSync(backupDir, { recursive: true });

            // Backup configuration
            const configBackup = {
                timestamp,
                config: this.getSimulatorConfig()
            };
            fs.writeFileSync(
                path.join(backupDir, 'config.json'),
                JSON.stringify(configBackup, null, 2)
            );

            // Backup current data files
            for (const [key, filePath] of this.currentFiles.entries()) {
                if (fs.existsSync(filePath)) {
                    const backupPath = path.join(backupDir, path.basename(filePath));
                    fs.copyFileSync(filePath, backupPath);
                }
            }

            this.logger.logSystem('DataPersistenceManager', 'Backup created', {
                path: backupDir
            });

            // Clean up old backups
            await this.cleanupOldData();
        } catch (error) {
            this.logger.logError('DataPersistenceManager', error as Error);
            throw error;
        }
    }

    /**
     * Clean up old data based on retention policy
     */
    private async cleanupOldData(): Promise<void> {
        try {
            const now = new Date();

            // Clean up each data type
            await this.cleanupDirectory('metrics', this.config.retentionPeriod.metrics);
            await this.cleanupDirectory('events', this.config.retentionPeriod.events);
            await this.cleanupDirectory('logs', this.config.retentionPeriod.logs);
            await this.cleanupDirectory('backups', this.config.retentionPeriod.backups);

            this.logger.logSystem('DataPersistenceManager', 'Cleanup completed');
        } catch (error) {
            this.logger.logError('DataPersistenceManager', error as Error);
        }
    }

    /**
     * Clean up old files in a directory
     */
    private async cleanupDirectory(directory: string, retentionDays: number): Promise<void> {
        const dirPath = path.join(this.config.basePath, directory);
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath);
        const now = new Date().getTime();
        const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtime.getTime();

            if (age > retentionMs) {
                fs.unlinkSync(filePath);
                this.logger.logSystem('DataPersistenceManager', 'File deleted', {
                    path: filePath,
                    age: Math.round(age / (24 * 60 * 60 * 1000))
                });
            }
        }
    }

    /**
     * Get simulator configuration
     */
    private getSimulatorConfig(): SimulatorConfig {
        // This should be implemented to get the current simulator configuration
        // from the ConfigurationManager
        return {} as SimulatorConfig;
    }

    /**
     * Restore from backup
     */
    public async restoreFromBackup(backupPath: string): Promise<void> {
        try {
            if (!fs.existsSync(backupPath)) {
                throw new Error('Backup path does not exist');
            }

            // Read configuration
            const configPath = path.join(backupPath, 'config.json');
            if (fs.existsSync(configPath)) {
                const configBackup = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                // Implement configuration restoration logic
            }

            // Restore data files
            const files = fs.readdirSync(backupPath);
            for (const file of files) {
                if (file === 'config.json') continue;

                const sourcePath = path.join(backupPath, file);
                const targetPath = path.join(this.config.basePath, 'restored_data', file);

                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                fs.copyFileSync(sourcePath, targetPath);
            }

            this.logger.logSystem('DataPersistenceManager', 'Backup restored', {
                path: backupPath
            });
        } catch (error) {
            this.logger.logError('DataPersistenceManager', error as Error);
            throw error;
        }
    }

    /**
     * Update storage configuration
     */
    public updateConfig(config: Partial<StorageConfig>): void {
        this.config = {
            ...this.config,
            ...config,
            retentionPeriod: {
                ...this.config.retentionPeriod,
                ...config.retentionPeriod
            }
        };

        // Restart auto-backup if interval changed
        if (config.autoBackupInterval) {
            this.startAutoBackup();
        }

        this.logger.logSystem('DataPersistenceManager', 'Configuration updated', {
            config: this.config
        });
    }

    /**
     * Stop persistence manager
     */
    public stop(): void {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        this.logger.logSystem('DataPersistenceManager', 'Persistence manager stopped');
    }
} 