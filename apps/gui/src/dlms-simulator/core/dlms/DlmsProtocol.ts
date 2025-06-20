import { SecurityLevel } from '../cosem/data/Types';

/**
 * DLMS Protocol Constants
 */
export const DLMS_CONSTANTS = {
    START_FRAME: 0x7E,
    FORMAT_IDENTIFIER: 0xA0,
    FRAME_FORMAT_TYPE: 0x93,
    DESTINATION_ADDRESS: 0x03,
    SOURCE_ADDRESS: 0x01,
    CONTROL_FIELD: 0x13,
    HCS_LENGTH: 2,
    FCS_LENGTH: 2
};

/**
 * DLMS Frame Types
 */
export enum DlmsFrameType {
    SNRM = 0x93,      // Set Normal Response Mode
    UA = 0x73,        // Unnumbered Acknowledgement
    DISC = 0x53,      // Disconnect
    AARQ = 0x60,      // Application Association Request
    AARE = 0x61,      // Application Association Response
    GET_REQUEST = 0xC0,
    GET_RESPONSE = 0xC4,
    SET_REQUEST = 0xC1,
    SET_RESPONSE = 0xC5,
    ACTION_REQUEST = 0xC3,
    ACTION_RESPONSE = 0xC7,
    EVENT_NOTIFICATION = 0xC2
}

/**
 * DLMS Frame Structure
 */
export interface DlmsFrame {
    frameType: DlmsFrameType;
    sourceAddress: number;
    destinationAddress: number;
    control: number;
    payload: Buffer;
    security?: {
        level: SecurityLevel;
        authenticationKey?: Buffer;
        encryptionKey?: Buffer;
    };
}

/**
 * DLMS Protocol Handler
 */
export class DlmsProtocol {
    private buffer: Buffer;
    private frameInProgress: boolean;
    private currentFrame: Buffer;

    constructor() {
        this.buffer = Buffer.alloc(0);
        this.frameInProgress = false;
        this.currentFrame = Buffer.alloc(0);
    }

    /**
     * Create DLMS frame
     */
    public createFrame(frame: DlmsFrame): Buffer {
        const frameBuffer = Buffer.alloc(1024); // Initial size, will be trimmed
        let offset = 0;

        // Start flag
        frameBuffer[offset++] = DLMS_CONSTANTS.START_FRAME;

        // Format identifier and frame type
        frameBuffer[offset++] = DLMS_CONSTANTS.FORMAT_IDENTIFIER;
        frameBuffer[offset++] = frame.frameType;

        // Destination and source addresses
        frameBuffer[offset++] = frame.destinationAddress;
        frameBuffer[offset++] = frame.sourceAddress;

        // Control field
        frameBuffer[offset++] = frame.control;

        // HCS (Header Check Sequence) - Placeholder
        offset += DLMS_CONSTANTS.HCS_LENGTH;

        // Payload
        frame.payload.copy(frameBuffer, offset);
        offset += frame.payload.length;

        // FCS (Frame Check Sequence) - Placeholder
        offset += DLMS_CONSTANTS.FCS_LENGTH;

        // End flag
        frameBuffer[offset++] = DLMS_CONSTANTS.START_FRAME;

        // Calculate and set HCS
        const hcs = this.calculateHCS(frameBuffer.slice(1, 6));
        hcs.copy(frameBuffer, 6);

        // Calculate and set FCS
        const fcs = this.calculateFCS(frameBuffer.slice(1, offset - 3));
        fcs.copy(frameBuffer, offset - 3);

        return frameBuffer.slice(0, offset);
    }

    /**
     * Parse incoming data
     */
    public parseData(data: Buffer): DlmsFrame[] {
        const frames: DlmsFrame[] = [];
        this.buffer = Buffer.concat([this.buffer, data]);

        while (this.buffer.length > 0) {
            if (!this.frameInProgress) {
                const startIndex = this.buffer.indexOf(DLMS_CONSTANTS.START_FRAME);
                if (startIndex === -1) {
                    // No start flag found, clear buffer
                    this.buffer = Buffer.alloc(0);
                    break;
                }
                if (startIndex > 0) {
                    // Remove data before start flag
                    this.buffer = this.buffer.slice(startIndex);
                }
                this.frameInProgress = true;
                this.currentFrame = Buffer.from([this.buffer[0]]);
                this.buffer = this.buffer.slice(1);
                continue;
            }

            // Look for end flag
            const endIndex = this.buffer.indexOf(DLMS_CONSTANTS.START_FRAME);
            if (endIndex === -1) {
                // End flag not found yet
                this.currentFrame = Buffer.concat([this.currentFrame, this.buffer]);
                this.buffer = Buffer.alloc(0);
                break;
            }

            // Complete frame found
            this.currentFrame = Buffer.concat([
                this.currentFrame,
                this.buffer.slice(0, endIndex + 1)
            ]);
            this.buffer = this.buffer.slice(endIndex + 1);

            // Parse the frame
            const frame = this.parseFrame(this.currentFrame);
            if (frame) {
                frames.push(frame);
            }

            // Reset for next frame
            this.frameInProgress = false;
            this.currentFrame = Buffer.alloc(0);
        }

        return frames;
    }

    /**
     * Parse a complete frame
     */
    private parseFrame(frameBuffer: Buffer): DlmsFrame | null {
        if (frameBuffer.length < 9) { // Minimum frame size
            return null;
        }

        // Verify HCS
        const calculatedHCS = this.calculateHCS(frameBuffer.slice(1, 6));
        const receivedHCS = frameBuffer.slice(6, 8);
        if (!calculatedHCS.equals(receivedHCS)) {
            return null;
        }

        // Verify FCS
        const calculatedFCS = this.calculateFCS(frameBuffer.slice(1, frameBuffer.length - 3));
        const receivedFCS = frameBuffer.slice(frameBuffer.length - 3, frameBuffer.length - 1);
        if (!calculatedFCS.equals(receivedFCS)) {
            return null;
        }

        return {
            frameType: frameBuffer[2],
            destinationAddress: frameBuffer[3],
            sourceAddress: frameBuffer[4],
            control: frameBuffer[5],
            payload: frameBuffer.slice(8, frameBuffer.length - 3)
        };
    }

    /**
     * Calculate Header Check Sequence
     */
    private calculateHCS(header: Buffer): Buffer {
        // Implement CRC-16 for HCS
        return this.calculateCRC16(header);
    }

    /**
     * Calculate Frame Check Sequence
     */
    private calculateFCS(frame: Buffer): Buffer {
        // Implement CRC-16 for FCS
        return this.calculateCRC16(frame);
    }

    /**
     * Calculate CRC-16
     */
    private calculateCRC16(data: Buffer): Buffer {
        let crc = 0xFFFF;
        const polynomial = 0x8408;

        for (let i = 0; i < data.length; i++) {
            crc ^= data[i];
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x0001) !== 0) {
                    crc = (crc >> 1) ^ polynomial;
                } else {
                    crc = crc >> 1;
                }
            }
        }

        crc = ~crc;
        return Buffer.from([crc & 0xFF, (crc >> 8) & 0xFF]);
    }

    /**
     * Create SNRM request
     */
    public createSNRMRequest(): Buffer {
        return this.createFrame({
            frameType: DlmsFrameType.SNRM,
            sourceAddress: DLMS_CONSTANTS.SOURCE_ADDRESS,
            destinationAddress: DLMS_CONSTANTS.DESTINATION_ADDRESS,
            control: DLMS_CONSTANTS.CONTROL_FIELD,
            payload: Buffer.alloc(0)
        });
    }

    /**
     * Create UA response
     */
    public createUAResponse(): Buffer {
        return this.createFrame({
            frameType: DlmsFrameType.UA,
            sourceAddress: DLMS_CONSTANTS.SOURCE_ADDRESS,
            destinationAddress: DLMS_CONSTANTS.DESTINATION_ADDRESS,
            control: DLMS_CONSTANTS.CONTROL_FIELD,
            payload: Buffer.alloc(0)
        });
    }

    /**
     * Create AARQ request
     */
    public createAARQRequest(authenticationKey?: Buffer): Buffer {
        // TODO: Implement proper AARQ request with authentication
        const payload = Buffer.from([0x60, 0x36, 0xA1, 0x09, 0x06, 0x07, 0x60, 0x85, 0x74, 0x05, 0x08, 0x01, 0x01]);
        
        return this.createFrame({
            frameType: DlmsFrameType.AARQ,
            sourceAddress: DLMS_CONSTANTS.SOURCE_ADDRESS,
            destinationAddress: DLMS_CONSTANTS.DESTINATION_ADDRESS,
            control: DLMS_CONSTANTS.CONTROL_FIELD,
            payload,
            security: authenticationKey ? {
                level: SecurityLevel.AUTHENTICATION,
                authenticationKey
            } : undefined
        });
    }

    /**
     * Create Get request
     */
    public createGetRequest(classId: number, attributeId: number, instanceId: Buffer): Buffer {
        const payload = Buffer.concat([
            Buffer.from([classId]),
            instanceId,
            Buffer.from([attributeId])
        ]);

        return this.createFrame({
            frameType: DlmsFrameType.GET_REQUEST,
            sourceAddress: DLMS_CONSTANTS.SOURCE_ADDRESS,
            destinationAddress: DLMS_CONSTANTS.DESTINATION_ADDRESS,
            control: DLMS_CONSTANTS.CONTROL_FIELD,
            payload
        });
    }
} 