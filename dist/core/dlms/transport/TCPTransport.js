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
exports.TCPTransport = void 0;
const events_1 = require("events");
const net = __importStar(require("net"));
/**
 * TCP Transport Implementation
 */
class TCPTransport extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.socket = null;
        this.connected = false;
        this.buffer = Buffer.alloc(0);
    }
    /**
     * Connect to remote device
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                reject(new Error('Already connected'));
                return;
            }
            this.socket = new net.Socket();
            // Configure socket
            this.socket.setKeepAlive(this.config.keepAlive, this.config.keepAliveInitialDelay);
            // Handle connection
            this.socket.on('connect', () => {
                this.connected = true;
                this.emit('connected');
                resolve();
            });
            // Handle data
            this.socket.on('data', (data) => {
                this.handleData(data);
            });
            // Handle errors
            this.socket.on('error', (error) => {
                this.emit('error', error);
                if (!this.connected) {
                    reject(error);
                }
            });
            // Handle connection close
            this.socket.on('close', () => {
                this.connected = false;
                this.socket = null;
                this.emit('disconnected');
            });
            // Connect to remote device
            this.socket.connect({
                host: this.config.host,
                port: this.config.port
            });
            // Set connection timeout
            this.socket.setTimeout(this.config.connectTimeout);
        });
    }
    /**
     * Disconnect from remote device
     */
    disconnect() {
        return new Promise((resolve) => {
            if (!this.connected || !this.socket) {
                resolve();
                return;
            }
            this.socket.end(() => {
                this.connected = false;
                this.socket = null;
                resolve();
            });
        });
    }
    /**
     * Send data to remote device
     */
    send(data) {
        return new Promise((resolve, reject) => {
            if (!this.connected || !this.socket) {
                reject(new Error('Not connected'));
                return;
            }
            this.socket.write(data, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Handle received data
     */
    handleData(data) {
        // Append received data to buffer
        this.buffer = Buffer.concat([this.buffer, data]);
        // Process complete frames
        let offset = 0;
        while (offset < this.buffer.length) {
            // Check if we have a complete frame
            const frameLength = this.getFrameLength(this.buffer.slice(offset));
            if (frameLength === 0 || offset + frameLength > this.buffer.length) {
                break;
            }
            // Extract frame
            const frame = this.buffer.slice(offset, offset + frameLength);
            offset += frameLength;
            // Emit frame
            this.emit('frame', frame);
        }
        // Remove processed data from buffer
        this.buffer = this.buffer.slice(offset);
    }
    /**
     * Get frame length from buffer
     * This method should be implemented according to the specific protocol
     * being used (e.g., DLMS/COSEM wrapper or HDLC)
     */
    getFrameLength(buffer) {
        if (buffer.length < 2) {
            return 0;
        }
        // For DLMS/COSEM wrapper protocol:
        // First two bytes contain the frame length
        return buffer.readUInt16BE(0) + 2;
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Get local address
     */
    getLocalAddress() {
        return this.socket?.localAddress;
    }
    /**
     * Get local port
     */
    getLocalPort() {
        return this.socket?.localPort;
    }
    /**
     * Get remote address
     */
    getRemoteAddress() {
        return this.socket?.remoteAddress;
    }
    /**
     * Get remote port
     */
    getRemotePort() {
        return this.socket?.remotePort;
    }
}
exports.TCPTransport = TCPTransport;
