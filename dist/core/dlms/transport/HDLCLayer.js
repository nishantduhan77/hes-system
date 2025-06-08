"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDLCLayer = exports.HDLCState = void 0;
const events_1 = require("events");
const HDLCFrame_1 = require("./HDLCFrame");
/**
 * HDLC Layer States
 */
var HDLCState;
(function (HDLCState) {
    HDLCState[HDLCState["DISCONNECTED"] = 0] = "DISCONNECTED";
    HDLCState[HDLCState["CONNECTING"] = 1] = "CONNECTING";
    HDLCState[HDLCState["CONNECTED"] = 2] = "CONNECTED";
    HDLCState[HDLCState["DISCONNECTING"] = 3] = "DISCONNECTING";
})(HDLCState || (exports.HDLCState = HDLCState = {}));
/**
 * HDLC Layer Implementation
 */
class HDLCLayer extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.state = HDLCState.DISCONNECTED;
        this.config = config;
        this.sendSequence = 0;
        this.receiveSequence = 0;
        this.windowSize = config.windowSize;
        this.pendingFrames = new Map();
    }
    /**
     * Connect to remote device
     */
    async connect() {
        if (this.state !== HDLCState.DISCONNECTED) {
            throw new Error('Already connected or connecting');
        }
        this.state = HDLCState.CONNECTING;
        try {
            // Send SNRM frame
            const snrmFrame = new HDLCFrame_1.HDLCFrame(HDLCFrame_1.FrameFormat.TYPE_3, HDLCFrame_1.FrameType.SNRM, this.config.clientAddress, this.config.serverAddress, Buffer.alloc(0), 0, 0, true, false);
            // Wait for UA response
            const response = await this.sendFrame(snrmFrame);
            if (response.getType() !== HDLCFrame_1.FrameType.UA) {
                throw new Error('Unexpected response to SNRM');
            }
            this.state = HDLCState.CONNECTED;
            this.emit('connected');
        }
        catch (error) {
            this.state = HDLCState.DISCONNECTED;
            throw error;
        }
    }
    /**
     * Disconnect from remote device
     */
    async disconnect() {
        if (this.state !== HDLCState.CONNECTED) {
            throw new Error('Not connected');
        }
        this.state = HDLCState.DISCONNECTING;
        try {
            // Send DISC frame
            const discFrame = new HDLCFrame_1.HDLCFrame(HDLCFrame_1.FrameFormat.TYPE_3, HDLCFrame_1.FrameType.DISC, this.config.clientAddress, this.config.serverAddress, Buffer.alloc(0), 0, 0, true, false);
            // Wait for UA response
            const response = await this.sendFrame(discFrame);
            if (response.getType() !== HDLCFrame_1.FrameType.UA) {
                throw new Error('Unexpected response to DISC');
            }
        }
        finally {
            this.state = HDLCState.DISCONNECTED;
            this.clearPendingFrames();
            this.emit('disconnected');
        }
    }
    /**
     * Send data to remote device
     */
    async sendData(data) {
        if (this.state !== HDLCState.CONNECTED) {
            throw new Error('Not connected');
        }
        // Create information frame
        const frame = new HDLCFrame_1.HDLCFrame(HDLCFrame_1.FrameFormat.TYPE_1, HDLCFrame_1.FrameType.I_FRAME, this.config.clientAddress, this.config.serverAddress, data, this.sendSequence, this.receiveSequence, true, false);
        // Send frame and wait for acknowledgment
        await this.sendFrame(frame);
        // Update send sequence
        this.sendSequence = (this.sendSequence + 1) % 8;
    }
    /**
     * Handle received frame
     */
    handleFrame(frame) {
        switch (frame.getFormat()) {
            case HDLCFrame_1.FrameFormat.TYPE_1:
                this.handleInformationFrame(frame);
                break;
            case HDLCFrame_1.FrameFormat.TYPE_2:
                this.handleSupervisoryFrame(frame);
                break;
            case HDLCFrame_1.FrameFormat.TYPE_3:
                this.handleUnnumberedFrame(frame);
                break;
        }
    }
    /**
     * Send frame and wait for response
     */
    sendFrame(frame) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingFrames.delete(frame.getSendSequence());
                reject(new Error('Response timeout'));
            }, this.config.responseTimeout);
            this.pendingFrames.set(frame.getSendSequence(), { frame, timer });
            this.emit('send', frame.encode());
        });
    }
    /**
     * Handle information frame
     */
    handleInformationFrame(frame) {
        // Verify receive sequence
        if (frame.getReceiveSequence() !== this.sendSequence) {
            this.sendReject();
            return;
        }
        // Update receive sequence
        this.receiveSequence = (this.receiveSequence + 1) % 8;
        // Send acknowledgment
        this.sendReceiveReady();
        // Emit received data
        this.emit('data', frame.getData());
    }
    /**
     * Handle supervisory frame
     */
    handleSupervisoryFrame(frame) {
        switch (frame.getType()) {
            case HDLCFrame_1.FrameType.RR:
                this.handleReceiveReady(frame);
                break;
            case HDLCFrame_1.FrameType.RNR:
                this.handleReceiveNotReady(frame);
                break;
            case HDLCFrame_1.FrameType.REJ:
                this.handleReject(frame);
                break;
        }
    }
    /**
     * Handle unnumbered frame
     */
    handleUnnumberedFrame(frame) {
        switch (frame.getType()) {
            case HDLCFrame_1.FrameType.SNRM:
                this.handleSetNormalResponseMode(frame);
                break;
            case HDLCFrame_1.FrameType.DISC:
                this.handleDisconnect(frame);
                break;
            case HDLCFrame_1.FrameType.UA:
                this.handleUnnumberedAcknowledgment(frame);
                break;
            case HDLCFrame_1.FrameType.DM:
                this.handleDisconnectedMode(frame);
                break;
            case HDLCFrame_1.FrameType.FRMR:
                this.handleFrameReject(frame);
                break;
        }
    }
    /**
     * Send receive ready frame
     */
    sendReceiveReady() {
        const frame = new HDLCFrame_1.HDLCFrame(HDLCFrame_1.FrameFormat.TYPE_2, HDLCFrame_1.FrameType.RR, this.config.clientAddress, this.config.serverAddress, Buffer.alloc(0), 0, this.receiveSequence, false, true);
        this.emit('send', frame.encode());
    }
    /**
     * Send reject frame
     */
    sendReject() {
        const frame = new HDLCFrame_1.HDLCFrame(HDLCFrame_1.FrameFormat.TYPE_2, HDLCFrame_1.FrameType.REJ, this.config.clientAddress, this.config.serverAddress, Buffer.alloc(0), 0, this.receiveSequence, false, true);
        this.emit('send', frame.encode());
    }
    /**
     * Handle receive ready frame
     */
    handleReceiveReady(frame) {
        const pending = this.pendingFrames.get(frame.getReceiveSequence());
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingFrames.delete(frame.getReceiveSequence());
        }
    }
    /**
     * Handle receive not ready frame
     */
    handleReceiveNotReady(frame) {
        // TODO: Implement flow control
    }
    /**
     * Handle reject frame
     */
    handleReject(frame) {
        // TODO: Implement frame retransmission
    }
    /**
     * Handle set normal response mode frame
     */
    handleSetNormalResponseMode(frame) {
        const response = new HDLCFrame_1.HDLCFrame(HDLCFrame_1.FrameFormat.TYPE_3, HDLCFrame_1.FrameType.UA, this.config.clientAddress, this.config.serverAddress, Buffer.alloc(0), 0, 0, false, true);
        this.emit('send', response.encode());
    }
    /**
     * Handle disconnect frame
     */
    handleDisconnect(frame) {
        const response = new HDLCFrame_1.HDLCFrame(HDLCFrame_1.FrameFormat.TYPE_3, HDLCFrame_1.FrameType.UA, this.config.clientAddress, this.config.serverAddress, Buffer.alloc(0), 0, 0, false, true);
        this.emit('send', response.encode());
        this.state = HDLCState.DISCONNECTED;
        this.clearPendingFrames();
        this.emit('disconnected');
    }
    /**
     * Handle unnumbered acknowledgment frame
     */
    handleUnnumberedAcknowledgment(frame) {
        const pending = this.pendingFrames.get(0);
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingFrames.delete(0);
        }
    }
    /**
     * Handle disconnected mode frame
     */
    handleDisconnectedMode(frame) {
        this.state = HDLCState.DISCONNECTED;
        this.clearPendingFrames();
        this.emit('disconnected');
    }
    /**
     * Handle frame reject
     */
    handleFrameReject(frame) {
        // TODO: Implement frame reject handling
    }
    /**
     * Clear all pending frames
     */
    clearPendingFrames() {
        Array.from(this.pendingFrames.values()).forEach(({ timer }) => {
            clearTimeout(timer);
        });
        this.pendingFrames.clear();
    }
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
}
exports.HDLCLayer = HDLCLayer;
