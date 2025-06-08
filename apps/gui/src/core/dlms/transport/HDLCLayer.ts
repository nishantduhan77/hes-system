import { EventEmitter } from 'events';
import { HDLCFrame, FrameFormat, FrameType, HDLCAddress } from './HDLCFrame';

/**
 * HDLC Layer States
 */
export enum HDLCState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    DISCONNECTING
}

/**
 * HDLC Layer Configuration
 */
export interface HDLCConfig {
    windowSize: number;
    maxInfoLength: number;
    responseTimeout: number;
    interFrameTimeout: number;
    inactivityTimeout: number;
    serverAddress: HDLCAddress;
    clientAddress: HDLCAddress;
}

/**
 * HDLC Layer Implementation
 */
export class HDLCLayer extends EventEmitter {
    private state: HDLCState;
    private config: HDLCConfig;
    private sendSequence: number;
    private receiveSequence: number;
    private windowSize: number;
    private pendingFrames: Map<number, { frame: HDLCFrame; timer: NodeJS.Timeout }>;

    constructor(config: HDLCConfig) {
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
    public async connect(): Promise<void> {
        if (this.state !== HDLCState.DISCONNECTED) {
            throw new Error('Already connected or connecting');
        }

        this.state = HDLCState.CONNECTING;

        try {
            // Send SNRM frame
            const snrmFrame = new HDLCFrame(
                FrameFormat.TYPE_3,
                FrameType.SNRM,
                this.config.clientAddress,
                this.config.serverAddress,
                Buffer.alloc(0),
                0,
                0,
                true,
                false
            );

            // Wait for UA response
            const response = await this.sendFrame(snrmFrame);
            if (response.getType() !== FrameType.UA) {
                throw new Error('Unexpected response to SNRM');
            }

            this.state = HDLCState.CONNECTED;
            this.emit('connected');
        } catch (error) {
            this.state = HDLCState.DISCONNECTED;
            throw error;
        }
    }

    /**
     * Disconnect from remote device
     */
    public async disconnect(): Promise<void> {
        if (this.state !== HDLCState.CONNECTED) {
            throw new Error('Not connected');
        }

        this.state = HDLCState.DISCONNECTING;

        try {
            // Send DISC frame
            const discFrame = new HDLCFrame(
                FrameFormat.TYPE_3,
                FrameType.DISC,
                this.config.clientAddress,
                this.config.serverAddress,
                Buffer.alloc(0),
                0,
                0,
                true,
                false
            );

            // Wait for UA response
            const response = await this.sendFrame(discFrame);
            if (response.getType() !== FrameType.UA) {
                throw new Error('Unexpected response to DISC');
            }
        } finally {
            this.state = HDLCState.DISCONNECTED;
            this.clearPendingFrames();
            this.emit('disconnected');
        }
    }

    /**
     * Send data to remote device
     */
    public async sendData(data: Buffer): Promise<void> {
        if (this.state !== HDLCState.CONNECTED) {
            throw new Error('Not connected');
        }

        // Create information frame
        const frame = new HDLCFrame(
            FrameFormat.TYPE_1,
            FrameType.I_FRAME,
            this.config.clientAddress,
            this.config.serverAddress,
            data,
            this.sendSequence,
            this.receiveSequence,
            true,
            false
        );

        // Send frame and wait for acknowledgment
        await this.sendFrame(frame);

        // Update send sequence
        this.sendSequence = (this.sendSequence + 1) % 8;
    }

    /**
     * Handle received frame
     */
    public handleFrame(frame: HDLCFrame): void {
        switch (frame.getFormat()) {
            case FrameFormat.TYPE_1:
                this.handleInformationFrame(frame);
                break;
            case FrameFormat.TYPE_2:
                this.handleSupervisoryFrame(frame);
                break;
            case FrameFormat.TYPE_3:
                this.handleUnnumberedFrame(frame);
                break;
        }
    }

    /**
     * Send frame and wait for response
     */
    private sendFrame(frame: HDLCFrame): Promise<HDLCFrame> {
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
    private handleInformationFrame(frame: HDLCFrame): void {
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
    private handleSupervisoryFrame(frame: HDLCFrame): void {
        switch (frame.getType()) {
            case FrameType.RR:
                this.handleReceiveReady(frame);
                break;
            case FrameType.RNR:
                this.handleReceiveNotReady(frame);
                break;
            case FrameType.REJ:
                this.handleReject(frame);
                break;
        }
    }

    /**
     * Handle unnumbered frame
     */
    private handleUnnumberedFrame(frame: HDLCFrame): void {
        switch (frame.getType()) {
            case FrameType.SNRM:
                this.handleSetNormalResponseMode(frame);
                break;
            case FrameType.DISC:
                this.handleDisconnect(frame);
                break;
            case FrameType.UA:
                this.handleUnnumberedAcknowledgment(frame);
                break;
            case FrameType.DM:
                this.handleDisconnectedMode(frame);
                break;
            case FrameType.FRMR:
                this.handleFrameReject(frame);
                break;
        }
    }

    /**
     * Send receive ready frame
     */
    private sendReceiveReady(): void {
        const frame = new HDLCFrame(
            FrameFormat.TYPE_2,
            FrameType.RR,
            this.config.clientAddress,
            this.config.serverAddress,
            Buffer.alloc(0),
            0,
            this.receiveSequence,
            false,
            true
        );
        this.emit('send', frame.encode());
    }

    /**
     * Send reject frame
     */
    private sendReject(): void {
        const frame = new HDLCFrame(
            FrameFormat.TYPE_2,
            FrameType.REJ,
            this.config.clientAddress,
            this.config.serverAddress,
            Buffer.alloc(0),
            0,
            this.receiveSequence,
            false,
            true
        );
        this.emit('send', frame.encode());
    }

    /**
     * Handle receive ready frame
     */
    private handleReceiveReady(frame: HDLCFrame): void {
        const pending = this.pendingFrames.get(frame.getReceiveSequence());
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingFrames.delete(frame.getReceiveSequence());
        }
    }

    /**
     * Handle receive not ready frame
     */
    private handleReceiveNotReady(frame: HDLCFrame): void {
        // TODO: Implement flow control
    }

    /**
     * Handle reject frame
     */
    private handleReject(frame: HDLCFrame): void {
        // TODO: Implement frame retransmission
    }

    /**
     * Handle set normal response mode frame
     */
    private handleSetNormalResponseMode(frame: HDLCFrame): void {
        const response = new HDLCFrame(
            FrameFormat.TYPE_3,
            FrameType.UA,
            this.config.clientAddress,
            this.config.serverAddress,
            Buffer.alloc(0),
            0,
            0,
            false,
            true
        );
        this.emit('send', response.encode());
    }

    /**
     * Handle disconnect frame
     */
    private handleDisconnect(frame: HDLCFrame): void {
        const response = new HDLCFrame(
            FrameFormat.TYPE_3,
            FrameType.UA,
            this.config.clientAddress,
            this.config.serverAddress,
            Buffer.alloc(0),
            0,
            0,
            false,
            true
        );
        this.emit('send', response.encode());
        this.state = HDLCState.DISCONNECTED;
        this.clearPendingFrames();
        this.emit('disconnected');
    }

    /**
     * Handle unnumbered acknowledgment frame
     */
    private handleUnnumberedAcknowledgment(frame: HDLCFrame): void {
        const pending = this.pendingFrames.get(0);
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingFrames.delete(0);
        }
    }

    /**
     * Handle disconnected mode frame
     */
    private handleDisconnectedMode(frame: HDLCFrame): void {
        this.state = HDLCState.DISCONNECTED;
        this.clearPendingFrames();
        this.emit('disconnected');
    }

    /**
     * Handle frame reject
     */
    private handleFrameReject(frame: HDLCFrame): void {
        // TODO: Implement frame reject handling
    }

    /**
     * Clear all pending frames
     */
    private clearPendingFrames(): void {
        Array.from(this.pendingFrames.values()).forEach(({ timer }) => {
            clearTimeout(timer);
        });
        this.pendingFrames.clear();
    }

    /**
     * Get current state
     */
    public getState(): HDLCState {
        return this.state;
    }
} 