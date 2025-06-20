#!/usr/bin/env node

import { EventEmitter } from 'events';
import * as net from 'net';
import { SimulatorLogger, LogLevel } from '../core/monitoring/SimulatorLogger';

/**
 * DLMS/COSEM Simulator Main Entry Point
 * Implements IS 15959 standards for smart meter simulation
 */

class DlmsSimulator extends EventEmitter {
    private server: net.Server;
    private logger: SimulatorLogger;
    private port: number;
    private isRunning: boolean = false;

    constructor(port: number = 4059) {
        super();
        this.port = port;
        this.logger = SimulatorLogger.getInstance();
        this.server = net.createServer();
        this.setupServer();
    }

    private setupServer(): void {
        this.server.on('connection', (socket) => {
            this.logger.log(LogLevel.INFO, 'Connection', `New connection from ${socket.remoteAddress}:${socket.remotePort}`);
            this.handleConnection(socket);
        });

        this.server.on('error', (error) => {
            this.logger.logError('Server', error);
        });

        this.server.on('close', () => {
            this.logger.log(LogLevel.INFO, 'Server', 'Server closed');
            this.isRunning = false;
        });
    }

    private handleConnection(socket: net.Socket): void {
        let buffer = Buffer.alloc(0);

        socket.on('data', (data) => {
            buffer = Buffer.concat([buffer, data]);
            this.processDlmsFrame(socket, buffer);
        });

        socket.on('error', (error) => {
            this.logger.logError('Socket', error);
        });

        socket.on('close', () => {
            this.logger.log(LogLevel.INFO, 'Connection', `Connection closed: ${socket.remoteAddress}:${socket.remotePort}`);
        });
    }

    private processDlmsFrame(socket: net.Socket, buffer: Buffer): void {
        // Basic DLMS frame processing
        if (buffer.length < 2) return;

        // Check for HDLC frame start (0x7E)
        const startIndex = buffer.indexOf(0x7E);
        if (startIndex === -1) return;

        // Find frame end
        const endIndex = buffer.indexOf(0x7E, startIndex + 1);
        if (endIndex === -1) return;

        // Extract frame
        const frame = buffer.subarray(startIndex + 1, endIndex);
        buffer = buffer.subarray(endIndex + 1);

        this.logger.log(LogLevel.INFO, 'DLMS', `Received DLMS frame: ${frame.toString('hex')}`);

        // Process frame and send response
        const response = this.createResponse(frame);
        if (response) {
            socket.write(response);
            this.logger.log(LogLevel.INFO, 'DLMS', `Sent response: ${response.toString('hex')}`);
        }
    }

    private createResponse(frame: Buffer): Buffer | null {
        // Simple response for testing
        // In a real implementation, this would parse the frame and create appropriate responses
        
        // Create a basic AARE (Application Association Response) frame
        const aareFrame = Buffer.from([
            0x7E, // Start delimiter
            0x61, // AARE tag
            0x09, // Length
            0x06, // Application context name
            0x07, // Length
            0x60, // Object identifier
            0x85, // Length
            0x74, // Object identifier
            0x05, // Length
            0x08, // Object identifier
            0x01, // Length
            0x01, // Object identifier
            0x7E  // End delimiter
        ]);

        return aareFrame;
    }

    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isRunning) {
                resolve();
                return;
            }

            this.server.listen(this.port, () => {
                this.isRunning = true;
                this.logger.log(LogLevel.INFO, 'Simulator', `DLMS Simulator started on port ${this.port}`);
                this.logger.log(LogLevel.INFO, 'Simulator', 'Ready to accept DLMS/COSEM connections');
                this.logger.log(LogLevel.INFO, 'Simulator', 'Press Ctrl+C to stop the simulator');
                resolve();
            });

            this.server.on('error', reject);
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.isRunning) {
                resolve();
                return;
            }

            this.server.close(() => {
                this.isRunning = false;
                this.logger.log(LogLevel.INFO, 'Simulator', 'DLMS Simulator stopped');
                resolve();
            });
        });
    }

    public getStatus(): { isRunning: boolean; port: number } {
        return {
            isRunning: this.isRunning,
            port: this.port
        };
    }
}

// Main execution
async function main() {
    console.log('==========================================');
    console.log('DLMS/COSEM Simulator (IS 15959)');
    console.log('==========================================');

    const port = parseInt(process.env.DLMS_PORT || '4059');
    const simulator = new DlmsSimulator(port);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down DLMS Simulator...');
        await simulator.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\nShutting down DLMS Simulator...');
        await simulator.stop();
        process.exit(0);
    });

    try {
        await simulator.start();
        
        // Keep the process running
        setInterval(() => {
            const status = simulator.getStatus();
            if (status.isRunning) {
                console.log(`[${new Date().toISOString()}] Simulator running on port ${status.port}`);
            }
        }, 30000); // Log status every 30 seconds

    } catch (error) {
        console.error('Failed to start DLMS Simulator:', error);
        process.exit(1);
    }
}

// Run the simulator
if (require.main === module) {
    main().catch(console.error);
}

export { DlmsSimulator }; 