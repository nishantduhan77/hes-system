import * as mqtt from 'mqtt';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { MeterReading } from '../types/meter';
import EventEmitter from 'events';

export interface MessageBrokerConfig {
    mqtt: {
        url: string;
        clientId: string;
        username?: string;
        password?: string;
        topics: string[];
    };
    kafka: {
        brokers: string[];
        clientId: string;
        topic: string;
        groupId: string;
    };
}

export class MessageBrokerService extends EventEmitter {
    private mqttClient: mqtt.Client;
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private config: MessageBrokerConfig;
    private isConnected: boolean = false;

    constructor(config: MessageBrokerConfig) {
        super();
        this.config = config;
        this.setupMQTT();
        this.setupKafka();
    }

    private setupMQTT(): void {
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
            } catch (error) {
                console.error('Error parsing MQTT message:', error);
            }
        });

        this.mqttClient.on('error', (error) => {
            console.error('MQTT error:', error);
            this.emit('error', { type: 'MQTT_ERROR', error });
        });
    }

    private async setupKafka(): Promise<void> {
        this.kafka = new Kafka({
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
                    const data = JSON.parse(message.value!.toString());
                    this.emit('kafkaMessage', { topic, partition, data });
                } catch (error) {
                    console.error('Error processing Kafka message:', error);
                }
            }
        });
    }

    public async publishToKafka(messages: MeterReading[]): Promise<void> {
        try {
            await this.producer.send({
                topic: this.config.kafka.topic,
                messages: messages.map(reading => ({
                    key: reading.meterId,
                    value: JSON.stringify(reading)
                }))
            });
        } catch (error) {
            console.error('Error publishing to Kafka:', error);
            throw error;
        }
    }

    public publishToMQTT(topic: string, message: any): void {
        try {
            this.mqttClient.publish(topic, JSON.stringify(message));
        } catch (error) {
            console.error('Error publishing to MQTT:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await this.producer.disconnect();
            await this.consumer.disconnect();
            this.mqttClient.end();
            this.isConnected = false;
        } catch (error) {
            console.error('Error disconnecting from message brokers:', error);
            throw error;
        }
    }

    public isActive(): boolean {
        return this.isConnected;
    }
} 