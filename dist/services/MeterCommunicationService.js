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
const MeterEventService_1 = __importStar(require("./MeterEventService"));
class MeterCommunicationService {
    constructor() {
        this.connections = new Map();
        this.baseUrl = 'http://localhost:8080/api';
        this.eventService = MeterEventService_1.default.getInstance();
    }
    static getInstance() {
        if (!MeterCommunicationService.instance) {
            MeterCommunicationService.instance = new MeterCommunicationService();
        }
        return MeterCommunicationService.instance;
    }
    async connect(meterId, ipAddress, port) {
        // In development mode, just simulate the connection
        const connection = {
            meterId,
            ipAddress,
            port,
            status: 'CONNECTED',
            lastCommunication: new Date().toISOString(),
            relayStatus: 'ON' // Default relay status
        };
        this.connections.set(meterId, connection);
    }
    async disconnect(meterId) {
        const connection = this.connections.get(meterId);
        if (connection) {
            connection.status = 'DISCONNECTED';
            this.connections.set(meterId, connection);
        }
    }
    async readMeterData(meterId, obisCodes) {
        const connection = this.connections.get(meterId);
        if (!connection || connection.status !== 'CONNECTED') {
            throw new Error('Meter is not connected');
        }
        // In development mode, return mock data
        const result = {};
        obisCodes.forEach(code => {
            result[code] = Math.random() * 100;
        });
        connection.lastCommunication = new Date().toISOString();
        this.connections.set(meterId, connection);
        return result;
    }
    // New method to control relay
    async controlRelay(meterId, action) {
        const connection = this.connections.get(meterId);
        if (!connection || connection.status !== 'CONNECTED') {
            throw new Error('Meter is not connected');
        }
        // In development mode, simulate relay control
        connection.relayStatus = action;
        connection.lastCommunication = new Date().toISOString();
        this.connections.set(meterId, connection);
        // Create an event for relay control
        await this.eventService.createEvent({
            meterId,
            eventType: 'RELAY_CONTROL',
            eventCode: action === 'ON' ? '0x00050000' : '0x00050001',
            description: `Relay turned ${action}`,
            severity: 'MEDIUM'
        });
    }
    // New method to get relay status
    async getRelayStatus(meterId) {
        const connection = this.connections.get(meterId);
        if (!connection || connection.status !== 'CONNECTED') {
            throw new Error('Meter is not connected');
        }
        return connection.relayStatus || 'OFF';
    }
    // New method to ping meter
    async pingMeter(meterId) {
        const connection = this.connections.get(meterId);
        if (!connection || connection.status !== 'CONNECTED') {
            throw new Error('Meter is not connected');
        }
        // In development mode, simulate ping response time (20-200ms)
        const responseTime = Math.floor(Math.random() * 180) + 20;
        connection.lastPingResponse = responseTime;
        connection.lastCommunication = new Date().toISOString();
        this.connections.set(meterId, connection);
        return responseTime;
    }
    async startPowerMonitoring(meterId) {
        // Monitor power status every 30 seconds
        setInterval(async () => {
            try {
                const connection = this.connections.get(meterId);
                if (!connection || connection.status !== 'CONNECTED') {
                    return;
                }
                // Check power status through voltage readings
                const data = await this.readMeterData(meterId, [
                    '1.0.32.7.0.255', // R Phase voltage
                    '1.0.52.7.0.255', // Y Phase voltage
                    '1.0.72.7.0.255' // B Phase voltage
                ]);
                const hasVoltage = Object.values(data).some(voltage => voltage > 180); // Minimum voltage threshold
                if (!hasVoltage) {
                    // Create power failure event
                    await this.eventService.createEvent({
                        meterId,
                        eventType: 'POWER_FAILURE',
                        eventCode: MeterEventService_1.INDIAN_EVENT_CODES.POWER_FAILURE.code,
                        description: MeterEventService_1.INDIAN_EVENT_CODES.POWER_FAILURE.description,
                        severity: MeterEventService_1.INDIAN_EVENT_CODES.POWER_FAILURE.severity
                    });
                }
                else {
                    // Monitor for power restoration
                    await this.eventService.monitorPowerRestoration(meterId);
                }
            }
            catch (error) {
                console.error('Error monitoring power status:', error);
            }
        }, 30000); // 30 seconds interval
    }
}
exports.default = MeterCommunicationService;
