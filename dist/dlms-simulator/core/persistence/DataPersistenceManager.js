"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataPersistenceManager = void 0;
const events_1 = require("events");
const SimulatorLogger_1 = require("../monitoring/SimulatorLogger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zlib_1 = require("zlib");
class DataPersistenceManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.backupInterval = null;
        this.currentFiles = new Map();
        this.logger = SimulatorLogger_1.SimulatorLogger.getInstance();
        this.config = { ...DataPersistenceManager.DEFAULT_CONFIG };
        this.initializeStorage();
        this.startAutoBackup();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!DataPersistenceManager.instance) {
            DataPersistenceManager.instance = new DataPersistenceManager();
        }
        return DataPersistenceManager.instance;
    }
    /**
     * Initialize storage structure
     */
    initializeStorage() {
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
        }
        catch (error) {
            this.logger.logError('DataPersistenceManager', error);
            throw error;
        }
    }
    /**
     * Start auto-backup process
     */
    startAutoBackup() {
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
    async storeGeneratedData(data) {
        const record = {
            timestamp: new Date(),
            type: 'generated_data',
            data
        };
        await this.writeToFile('generated_data', 'data', record);
    }
    /**
     * Store power quality event
     */
    async storePowerQualityEvent(event) {
        const record = {
            timestamp: new Date(),
            type: 'power_quality_event',
            data: event
        };
        await this.writeToFile('events', 'power_quality', record);
    }
    /**
     * Store metrics snapshot
     */
    async storeMetrics(metrics) {
        const record = {
            timestamp: new Date(),
            type: 'metrics',
            data: metrics
        };
        await this.writeToFile('metrics', 'statistics', record);
    }
    /**
     * Store health check results
     */
    async storeHealthCheck(health) {
        const record = {
            timestamp: new Date(),
            type: 'health_check',
            data: health
        };
        await this.writeToFile('metrics', 'health', record);
    }
    /**
     * Write data to file
     */
    async writeToFile(directory, prefix, data) {
        try {
            const date = new Date();
            const fileName = `${prefix}_${date.getFullYear()}${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}.json`;
            const filePath = path.join(this.config.basePath, directory, fileName);
            // Check if file exists and its size
            let fileContent = [];
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (stats.size >= this.config.maxFileSize) {
                    // Archive the file and start a new one
                    await this.archiveFile(filePath);
                    fileContent = [];
                }
                else {
                    fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
            }
            // Add new record and write to file
            fileContent.push(data);
            fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
            this.currentFiles.set(`${directory}_${prefix}`, filePath);
            this.emit('dataSaved', { directory, prefix, data });
        }
        catch (error) {
            this.logger.logError('DataPersistenceManager', error);
            throw error;
        }
    }
    /**
     * Archive a file using compression
     */
    async archiveFile(filePath) {
        try {
            const archivePath = `${filePath}.gz`;
            const readStream = fs.createReadStream(filePath);
            const writeStream = fs.createWriteStream(archivePath);
            const gzip = (0, zlib_1.createGzip)();
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
        }
        catch (error) {
            this.logger.logError('DataPersistenceManager', error);
            throw error;
        }
    }
    /**
     * Create system backup
     */
    async createBackup() {
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
            fs.writeFileSync(path.join(backupDir, 'config.json'), JSON.stringify(configBackup, null, 2));
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
        }
        catch (error) {
            this.logger.logError('DataPersistenceManager', error);
            throw error;
        }
    }
    /**
     * Clean up old data based on retention policy
     */
    async cleanupOldData() {
        try {
            const now = new Date();
            // Clean up each data type
            await this.cleanupDirectory('metrics', this.config.retentionPeriod.metrics);
            await this.cleanupDirectory('events', this.config.retentionPeriod.events);
            await this.cleanupDirectory('logs', this.config.retentionPeriod.logs);
            await this.cleanupDirectory('backups', this.config.retentionPeriod.backups);
            this.logger.logSystem('DataPersistenceManager', 'Cleanup completed');
        }
        catch (error) {
            this.logger.logError('DataPersistenceManager', error);
        }
    }
    /**
     * Clean up old files in a directory
     */
    async cleanupDirectory(directory, retentionDays) {
        const dirPath = path.join(this.config.basePath, directory);
        if (!fs.existsSync(dirPath))
            return;
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
    getSimulatorConfig() {
        // This should be implemented to get the current simulator configuration
        // from the ConfigurationManager
        return {};
    }
    /**
     * Restore from backup
     */
    async restoreFromBackup(backupPath) {
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
                if (file === 'config.json')
                    continue;
                const sourcePath = path.join(backupPath, file);
                const targetPath = path.join(this.config.basePath, 'restored_data', file);
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                fs.copyFileSync(sourcePath, targetPath);
            }
            this.logger.logSystem('DataPersistenceManager', 'Backup restored', {
                path: backupPath
            });
        }
        catch (error) {
            this.logger.logError('DataPersistenceManager', error);
            throw error;
        }
    }
    /**
     * Update storage configuration
     */
    updateConfig(config) {
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
    stop() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        this.logger.logSystem('DataPersistenceManager', 'Persistence manager stopped');
    }
}
exports.DataPersistenceManager = DataPersistenceManager;
DataPersistenceManager.DEFAULT_CONFIG = {
    basePath: './data',
    retentionPeriod: {
        metrics: 90, // 90 days
        events: 180, // 180 days
        logs: 30, // 30 days
        backups: 7 // 7 days
    },
    compressionEnabled: true,
    autoBackupInterval: 24, // 24 hours
    maxFileSize: 100 * 1024 * 1024 // 100MB
};
