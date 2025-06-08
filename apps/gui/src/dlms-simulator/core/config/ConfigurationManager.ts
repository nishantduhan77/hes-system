import { EventEmitter } from 'events';
import { SimulatorLogger } from '../monitoring/SimulatorLogger';
import { DataGenerationConfig } from '../data/DataGenerationManager';
import { PowerQualityConfig } from '../data/PowerQualityEventGenerator';

export interface SimulatorConfig {
    dataGeneration: DataGenerationConfig;
    powerQuality: PowerQualityConfig;
    communication: {
        hdlc: {
            windowSize: number;
            maxRetries: number;
            timeoutMs: number;
            keepAliveInterval: number;
        };
        tcp: {
            port: number;
            maxConnections: number;
            timeoutMs: number;
        };
        serial: {
            baudRate: number;
            dataBits: number;
            stopBits: number;
            parity: 'none' | 'even' | 'odd';
        };
    };
    logging: {
        maxLogEntries: number;
        maxEvents: number;
        retentionDays: number;
    };
}

export class ConfigurationManager extends EventEmitter {
    private static instance: ConfigurationManager;
    private config: SimulatorConfig;
    private logger: SimulatorLogger;
    private configPath: string;

    private static readonly DEFAULT_CONFIG: SimulatorConfig = {
        dataGeneration: {
            baseLoadProfile: {
                id: 'residential',
                name: 'Residential Load Profile',
                interval: 15,
                patterns: {
                    activePower: Array(96).fill(1000),    // Default 1kW
                    reactivePower: Array(96).fill(200),   // Default 200VAR
                    current: Array(96).fill(4.3),         // Default 4.3A
                    voltage: Array(96).fill(230),         // Default 230V
                    powerFactor: Array(96).fill(0.95)     // Default 0.95
                },
                seasonalFactors: {
                    spring: 0.8,
                    summer: 1.2,
                    autumn: 0.9,
                    winter: 1.1
                },
                dailyFactors: {
                    mon: 1.0,
                    tue: 1.0,
                    wed: 1.0,
                    thu: 1.0,
                    fri: 1.1,
                    sat: 0.9,
                    sun: 0.8
                }
            },
            seasonalPatterns: true,
            dailyPatterns: true,
            powerQualityEvents: true,
            randomVariation: 5,
            updateInterval: 1000,
            limits: {
                voltage: { min: 207, max: 253 },
                current: { min: 0, max: 100 },
                powerFactor: { min: 0.8, max: 1.0 },
                activePower: { min: 0, max: 25000 },
                reactivePower: { min: 0, max: 10000 }
            }
        },
        powerQuality: {
            sagProbability: 0.2,
            swellProbability: 0.1,
            interruptProbability: 0.05,
            harmonicsProbability: 0.15,
            flickerProbability: 0.1,
            limits: {
                sagDuration: { min: 100, max: 5000 },
                swellDuration: { min: 100, max: 3000 },
                interruptDuration: { min: 1000, max: 300000 },
                harmonicsDuration: { min: 300000, max: 3600000 },
                flickerDuration: { min: 60000, max: 900000 },
                sagMagnitude: { min: 50, max: 90 },
                swellMagnitude: { min: 110, max: 140 },
                harmonicsMagnitude: { min: 3, max: 8 },
                flickerMagnitude: { min: 2, max: 5 }
            }
        },
        communication: {
            hdlc: {
                windowSize: 1,
                maxRetries: 3,
                timeoutMs: 5000,
                keepAliveInterval: 60000
            },
            tcp: {
                port: 4059,
                maxConnections: 5,
                timeoutMs: 30000
            },
            serial: {
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none'
            }
        },
        logging: {
            maxLogEntries: 10000,
            maxEvents: 5000,
            retentionDays: 30
        }
    };

    private constructor(configPath: string = 'config.json') {
        super();
        this.configPath = configPath;
        this.logger = SimulatorLogger.getInstance();
        this.config = JSON.parse(JSON.stringify(ConfigurationManager.DEFAULT_CONFIG));
        this.loadConfig();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(configPath?: string): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager(configPath);
        }
        return ConfigurationManager.instance;
    }

    /**
     * Load configuration from file
     */
    private loadConfig(): void {
        try {
            const fs = require('fs');
            if (fs.existsSync(this.configPath)) {
                const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.config = this.mergeConfig(this.config, fileConfig);
                this.logger.logSystem('ConfigurationManager', 'Configuration loaded', {
                    path: this.configPath
                });
            } else {
                this.saveConfig();
                this.logger.logSystem('ConfigurationManager', 'Default configuration created', {
                    path: this.configPath
                });
            }
        } catch (error) {
            this.logger.logError('ConfigurationManager', error as Error);
        }
    }

    /**
     * Save configuration to file
     */
    private saveConfig(): void {
        try {
            const fs = require('fs');
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            this.logger.logSystem('ConfigurationManager', 'Configuration saved', {
                path: this.configPath
            });
        } catch (error) {
            this.logger.logError('ConfigurationManager', error as Error);
        }
    }

    /**
     * Merge configurations recursively
     */
    private mergeConfig<T>(target: T, source: Partial<T>): T {
        const merged = { ...target };

        for (const key in source) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                merged[key] = this.mergeConfig(
                    target[key] as any,
                    source[key] as any
                );
            } else {
                merged[key] = source[key] as any;
            }
        }

        return merged;
    }

    /**
     * Get configuration
     */
    public getConfig<T extends keyof SimulatorConfig>(
        section: T
    ): SimulatorConfig[T] {
        return this.config[section];
    }

    /**
     * Update configuration
     */
    public updateConfig<T extends keyof SimulatorConfig>(
        section: T,
        config: Partial<SimulatorConfig[T]>
    ): void {
        this.config[section] = this.mergeConfig(this.config[section], config);
        this.saveConfig();
        this.emit('configUpdate', { section, config: this.config[section] });
    }

    /**
     * Reset configuration to defaults
     */
    public resetConfig(section?: keyof SimulatorConfig): void {
        if (section) {
            this.config[section] = JSON.parse(JSON.stringify(ConfigurationManager.DEFAULT_CONFIG[section]));
        } else {
            this.config = JSON.parse(JSON.stringify(ConfigurationManager.DEFAULT_CONFIG));
        }
        this.saveConfig();
        this.emit('configReset', { section });
    }

    /**
     * Validate configuration
     */
    public validateConfig(section?: keyof SimulatorConfig): boolean {
        try {
            if (section) {
                this.validateConfigSection(section, this.config[section]);
            } else {
                for (const key in this.config) {
                    this.validateConfigSection(
                        key as keyof SimulatorConfig,
                        this.config[key as keyof SimulatorConfig]
                    );
                }
            }
            return true;
        } catch (error) {
            this.logger.logError('ConfigurationManager', error as Error);
            return false;
        }
    }

    /**
     * Validate configuration section
     */
    private validateConfigSection(
        section: keyof SimulatorConfig,
        config: any
    ): void {
        switch (section) {
            case 'dataGeneration':
                this.validateDataGenerationConfig(config as DataGenerationConfig);
                break;
            case 'powerQuality':
                this.validatePowerQualityConfig(config as PowerQualityConfig);
                break;
            case 'communication':
                this.validateCommunicationConfig(config as SimulatorConfig['communication']);
                break;
            case 'logging':
                this.validateLoggingConfig(config as SimulatorConfig['logging']);
                break;
        }
    }

    /**
     * Validate data generation configuration
     */
    private validateDataGenerationConfig(config: DataGenerationConfig): void {
        if (!config.baseLoadProfile) {
            throw new Error('Base load profile is required');
        }
        if (config.randomVariation < 0 || config.randomVariation > 100) {
            throw new Error('Random variation must be between 0 and 100');
        }
        if (config.updateInterval < 1000) {
            throw new Error('Update interval must be at least 1000ms');
        }
    }

    /**
     * Validate power quality configuration
     */
    private validatePowerQualityConfig(config: PowerQualityConfig): void {
        const probabilities = [
            'sagProbability',
            'swellProbability',
            'interruptProbability',
            'harmonicsProbability',
            'flickerProbability'
        ];

        for (const prop of probabilities) {
            const value = config[prop as keyof PowerQualityConfig] as number;
            if (value < 0 || value > 1) {
                throw new Error(`${prop} must be between 0 and 1`);
            }
        }
    }

    /**
     * Validate communication configuration
     */
    private validateCommunicationConfig(config: SimulatorConfig['communication']): void {
        if (config.tcp.port < 1 || config.tcp.port > 65535) {
            throw new Error('Invalid TCP port');
        }
        if (config.tcp.maxConnections < 1) {
            throw new Error('Max connections must be at least 1');
        }
        if (config.hdlc.windowSize < 1) {
            throw new Error('HDLC window size must be at least 1');
        }
    }

    /**
     * Validate logging configuration
     */
    private validateLoggingConfig(config: SimulatorConfig['logging']): void {
        if (config.maxLogEntries < 1000) {
            throw new Error('Max log entries must be at least 1000');
        }
        if (config.maxEvents < 1000) {
            throw new Error('Max events must be at least 1000');
        }
        if (config.retentionDays < 1) {
            throw new Error('Retention days must be at least 1');
        }
    }
} 