"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFactory = void 0;
const MessageBrokerService_1 = require("./MessageBrokerService");
const CacheService_1 = require("./CacheService");
const DatabaseService_1 = require("./DatabaseService");
const IngestService_1 = require("./IngestService");
const LoggingService_1 = require("./LoggingService");
const services_config_1 = require("../config/services.config");
class ServiceFactory {
    constructor(config = services_config_1.defaultConfig) {
        this.services = new Map();
        this.config = config;
        this.logger = LoggingService_1.LoggingService.getInstance({
            level: 'info',
            console: true,
            filename: 'logs/service.log'
        });
    }
    static getInstance(config) {
        if (!ServiceFactory.instance) {
            ServiceFactory.instance = new ServiceFactory(config);
        }
        return ServiceFactory.instance;
    }
    async initializeServices() {
        try {
            this.logger.info('Initializing services...');
            // Initialize message broker
            const messageBroker = new MessageBrokerService_1.MessageBrokerService(this.config.messageBroker);
            this.services.set('messageBroker', messageBroker);
            this.logger.info('Message broker service initialized');
            // Initialize cache
            const cache = new CacheService_1.CacheService(this.config.cache);
            this.services.set('cache', cache);
            this.logger.info('Cache service initialized');
            // Initialize database
            const database = new DatabaseService_1.DatabaseService(this.config.database);
            this.services.set('database', database);
            this.logger.info('Database service initialized');
            // Initialize ingest service
            const ingest = new IngestService_1.IngestService(messageBroker, cache, database, this.config.ingest);
            this.services.set('ingest', ingest);
            this.logger.info('Ingest service initialized');
            // Setup error handlers
            this.setupErrorHandlers();
            this.logger.info('All services initialized successfully');
        }
        catch (error) {
            this.logger.error('Error initializing services:', error);
            throw error;
        }
    }
    setupErrorHandlers() {
        const ingest = this.services.get('ingest');
        const messageBroker = this.services.get('messageBroker');
        ingest.on('error', (error) => {
            this.logger.error('Ingest service error:', error);
        });
        messageBroker.on('error', (error) => {
            this.logger.error('Message broker error:', error);
        });
    }
    getService(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            this.logger.error(`Service ${serviceName} not found`);
            throw new Error(`Service ${serviceName} not found`);
        }
        return service;
    }
    async stopServices() {
        try {
            this.logger.info('Stopping services...');
            // Stop ingest service first
            const ingest = this.services.get('ingest');
            if (ingest) {
                await ingest.stop();
                this.logger.info('Ingest service stopped');
            }
            // Disconnect message broker
            const messageBroker = this.services.get('messageBroker');
            if (messageBroker) {
                await messageBroker.disconnect();
                this.logger.info('Message broker disconnected');
            }
            // Disconnect cache
            const cache = this.services.get('cache');
            if (cache) {
                await cache.disconnect();
                this.logger.info('Cache service disconnected');
            }
            // Disconnect database
            const database = this.services.get('database');
            if (database) {
                await database.disconnect();
                this.logger.info('Database service disconnected');
            }
            this.services.clear();
            this.logger.info('All services stopped successfully');
        }
        catch (error) {
            this.logger.error('Error stopping services:', error);
            throw error;
        }
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.logger.info('Updating service configurations', { config });
        // Update individual service configurations
        if (config.messageBroker) {
            this.logger.info('Reinitializing message broker with new config');
            this.stopServices().then(() => this.initializeServices());
        }
        if (config.ingest) {
            const ingest = this.services.get('ingest');
            if (ingest) {
                ingest.updateConfig(config.ingest);
                this.logger.info('Ingest service configuration updated');
            }
        }
    }
}
exports.ServiceFactory = ServiceFactory;
