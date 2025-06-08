import { MessageBrokerService } from './MessageBrokerService';
import { CacheService } from './CacheService';
import { DatabaseService } from './DatabaseService';
import { IngestService } from './IngestService';
import { LoggingService } from './LoggingService';
import { ServicesConfig, defaultConfig } from '../config/services.config';

export class ServiceFactory {
    private static instance: ServiceFactory;
    private services: Map<string, any> = new Map();
    private config: ServicesConfig;
    private logger: LoggingService;

    private constructor(config: ServicesConfig = defaultConfig) {
        this.config = config;
        this.logger = LoggingService.getInstance({
            level: 'info',
            console: true,
            filename: 'logs/service.log'
        });
    }

    public static getInstance(config?: ServicesConfig): ServiceFactory {
        if (!ServiceFactory.instance) {
            ServiceFactory.instance = new ServiceFactory(config);
        }
        return ServiceFactory.instance;
    }

    public async initializeServices(): Promise<void> {
        try {
            this.logger.info('Initializing services...');

            // Initialize message broker
            const messageBroker = new MessageBrokerService(this.config.messageBroker);
            this.services.set('messageBroker', messageBroker);
            this.logger.info('Message broker service initialized');

            // Initialize cache
            const cache = new CacheService(this.config.cache);
            this.services.set('cache', cache);
            this.logger.info('Cache service initialized');

            // Initialize database
            const database = new DatabaseService(this.config.database);
            this.services.set('database', database);
            this.logger.info('Database service initialized');

            // Initialize ingest service
            const ingest = new IngestService(
                messageBroker,
                cache,
                database,
                this.config.ingest
            );
            this.services.set('ingest', ingest);
            this.logger.info('Ingest service initialized');

            // Setup error handlers
            this.setupErrorHandlers();

            this.logger.info('All services initialized successfully');
        } catch (error) {
            this.logger.error('Error initializing services:', error);
            throw error;
        }
    }

    private setupErrorHandlers(): void {
        const ingest = this.services.get('ingest') as IngestService;
        const messageBroker = this.services.get('messageBroker') as MessageBrokerService;

        ingest.on('error', (error) => {
            this.logger.error('Ingest service error:', error);
        });

        messageBroker.on('error', (error) => {
            this.logger.error('Message broker error:', error);
        });
    }

    public getService<T>(serviceName: string): T {
        const service = this.services.get(serviceName);
        if (!service) {
            this.logger.error(`Service ${serviceName} not found`);
            throw new Error(`Service ${serviceName} not found`);
        }
        return service as T;
    }

    public async stopServices(): Promise<void> {
        try {
            this.logger.info('Stopping services...');

            // Stop ingest service first
            const ingest = this.services.get('ingest') as IngestService;
            if (ingest) {
                await ingest.stop();
                this.logger.info('Ingest service stopped');
            }

            // Disconnect message broker
            const messageBroker = this.services.get('messageBroker') as MessageBrokerService;
            if (messageBroker) {
                await messageBroker.disconnect();
                this.logger.info('Message broker disconnected');
            }

            // Disconnect cache
            const cache = this.services.get('cache') as CacheService;
            if (cache) {
                await cache.disconnect();
                this.logger.info('Cache service disconnected');
            }

            // Disconnect database
            const database = this.services.get('database') as DatabaseService;
            if (database) {
                await database.disconnect();
                this.logger.info('Database service disconnected');
            }

            this.services.clear();
            this.logger.info('All services stopped successfully');
        } catch (error) {
            this.logger.error('Error stopping services:', error);
            throw error;
        }
    }

    public updateConfig(config: Partial<ServicesConfig>): void {
        this.config = { ...this.config, ...config };
        this.logger.info('Updating service configurations', { config });

        // Update individual service configurations
        if (config.messageBroker) {
            this.logger.info('Reinitializing message broker with new config');
            this.stopServices().then(() => this.initializeServices());
        }

        if (config.ingest) {
            const ingest = this.services.get('ingest') as IngestService;
            if (ingest) {
                ingest.updateConfig(config.ingest);
                this.logger.info('Ingest service configuration updated');
            }
        }
    }
} 