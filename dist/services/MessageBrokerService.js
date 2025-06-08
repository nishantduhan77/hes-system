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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBrokerService = void 0;
const mqtt = __importStar(require("mqtt"));
const kafkajs_1 = require("kafkajs");
const events_1 = __importDefault(require("events"));
class MessageBrokerService extends events_1.default {
    constructor(config) {
        super();
        this.isConnected = false;
        this.config = config;
        this.setupMQTT();
        this.setupKafka();
    }
    setupMQTT() {
        this.mqttClient = mqtt.connect(this.config.mqtt.url, {
            clientId: this.config.mqtt.clientId,
            username: this.config.mqtt.username,
            password: this.config.mqtt.password,
            clean: true
        });
        this.mqttClient.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.config.mqtt.topics.forEach(topic => {
                this.mqttClient.subscribe(topic, (err) => {
                    if (err) {
                        console.error(`Error subscribing to ${topic}:`, err);
                    }
                });
            });
        });
        this.mqttClient.on('message', (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                this.emit('mqttMessage', { topic, data });
            }
            catch (error) {
                console.error('Error parsing MQTT message:', error);
            }
        });
        this.mqttClient.on('error', (error) => {
            console.error('MQTT error:', error);
            this.emit('error', { type: 'MQTT_ERROR', error });
        });
    }
    async setupKafka() {
        this.kafka = new kafkajs_1.Kafka({
            clientId: this.config.kafka.clientId,
            brokers: this.config.kafka.brokers
        });
        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: this.config.kafka.groupId });
        await this.producer.connect();
        await this.consumer.connect();
        await this.consumer.subscribe({
            topic: this.config.kafka.topic,
            fromBeginning: true
        });
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const data = JSON.parse(message.value.toString());
                    this.emit('kafkaMessage', { topic, partition, data });
                }
                catch (error) {
                    console.error('Error processing Kafka message:', error);
                }
            }
        });
    }
    async publishToKafka(messages) {
        try {
            await this.producer.send({
                topic: this.config.kafka.topic,
                messages: messages.map(reading => ({
                    key: reading.meterId,
                    value: JSON.stringify(reading)
                }))
            });
        }
        catch (error) {
            console.error('Error publishing to Kafka:', error);
            throw error;
        }
    }
    publishToMQTT(topic, message) {
        try {
            this.mqttClient.publish(topic, JSON.stringify(message));
        }
        catch (error) {
            console.error('Error publishing to MQTT:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.producer.disconnect();
            await this.consumer.disconnect();
            this.mqttClient.end();
            this.isConnected = false;
        }
        catch (error) {
            console.error('Error disconnecting from message brokers:', error);
            throw error;
        }
    }
    isActive() {
        return this.isConnected;
    }
}
exports.MessageBrokerService = MessageBrokerService;
