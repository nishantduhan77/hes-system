/**
 * HDLC Frame Format Types
 */
export enum FrameFormat {
    TYPE_1 = 0xA0,
    TYPE_2 = 0xB0,
    TYPE_3 = 0xC0
}

/**
 * HDLC Frame Types
 */
export enum FrameType {
    I_FRAME = 0x00,
    RR = 0x01,  // Receive ready
    RNR = 0x05, // Receive not ready
    REJ = 0x09, // Reject
    SNRM = 0x83, // Set normal response mode
    UA = 0x63,   // Unnumbered acknowledgment
    DM = 0x0F,   // Disconnected mode
    DISC = 0x43, // Disconnect
    FRMR = 0x87  // Frame reject
}

/**
 * HDLC Address Format
 */
export interface HDLCAddress {
    upper: number;
    lower: number;
}

export const FLAG = 0x7E;
export const ESCAPE = 0x7D;
export const ESCAPE_MASK = 0x20;

/**
 * HDLC Frame Implementation
 */
export class HDLCFrame {
    private format: FrameFormat;
    private type: FrameType;
    private sourceAddress: HDLCAddress;
    private destinationAddress: HDLCAddress;
    private data: Buffer;
    private sendSequence: number;
    private receiveSequence: number;
    private poll: boolean;
    private final: boolean;

    constructor(
        format: FrameFormat,
        type: FrameType,
        sourceAddress: HDLCAddress,
        destinationAddress: HDLCAddress,
        data: Buffer = Buffer.alloc(0),
        sendSequence: number = 0,
        receiveSequence: number = 0,
        poll: boolean = false,
        final: boolean = false
    ) {
        this.format = format;
        this.type = type;
        this.sourceAddress = { ...sourceAddress };
        this.destinationAddress = { ...destinationAddress };
        this.data = Buffer.from(data);
        this.sendSequence = sendSequence;
        this.receiveSequence = receiveSequence;
        this.poll = poll;
        this.final = final;
    }

    /**
     * Get frame format
     */
    public getFormat(): FrameFormat {
        return this.format;
    }

    /**
     * Get frame type
     */
    public getType(): FrameType {
        return this.type;
    }

    /**
     * Get source address
     */
    public getSourceAddress(): HDLCAddress {
        return { ...this.sourceAddress };
    }

    /**
     * Get destination address
     */
    public getDestinationAddress(): HDLCAddress {
        return { ...this.destinationAddress };
    }

    /**
     * Get frame data
     */
    public getData(): Buffer {
        return Buffer.from(this.data);
    }

    /**
     * Get send sequence number
     */
    public getSendSequence(): number {
        return this.sendSequence;
    }

    /**
     * Get receive sequence number
     */
    public getReceiveSequence(): number {
        return this.receiveSequence;
    }

    /**
     * Get poll flag
     */
    public isPoll(): boolean {
        return this.poll;
    }

    /**
     * Get final flag
     */
    public isFinal(): boolean {
        return this.final;
    }

    /**
     * Encode frame to buffer
     */
    public encode(): Buffer {
        // Frame format:
        // [Flag] [Frame Format] [Dest Addr] [Src Addr] [Control] [HCS] [Data] [FCS] [Flag]

        // Calculate control field
        let control: number;
        switch (this.format) {
            case FrameFormat.TYPE_1:
                control = (this.sendSequence << 1) | (this.poll ? 0x10 : 0);
                break;
            case FrameFormat.TYPE_2:
                control = this.type | (this.receiveSequence << 5) | (this.poll ? 0x10 : 0);
                break;
            case FrameFormat.TYPE_3:
                control = this.type | (this.poll ? 0x10 : 0);
                break;
            default:
                throw new Error('Invalid frame format');
        }

        // Build frame without flags and checksums
        const frame = Buffer.concat([
            Buffer.from([this.format]),
            Buffer.from([this.destinationAddress.upper, this.destinationAddress.lower]),
            Buffer.from([this.sourceAddress.upper, this.sourceAddress.lower]),
            Buffer.from([control]),
            this.data
        ]);

        // Calculate HCS and FCS
        const hcs = HDLCFrame.calculateHCS(frame.slice(0, 5));
        const fcs = HDLCFrame.calculateFCS(frame);

        // Build complete frame
        const completeFrame = Buffer.concat([
            Buffer.from([FLAG]),
            frame,
            Buffer.from([hcs & 0xFF, (hcs >> 8) & 0xFF]),
            Buffer.from([fcs & 0xFF, (fcs >> 8) & 0xFF]),
            Buffer.from([FLAG])
        ]);

        return this.escapeFrame(completeFrame);
    }

    /**
     * Decode frame from buffer
     */
    public static decode(buffer: Buffer): HDLCFrame {
        // Find start and end flags
        let start = buffer.indexOf(FLAG);
        let end = buffer.lastIndexOf(FLAG);
        if (start === -1 || end === -1 || start === end) {
            throw new Error('Invalid frame: missing flags');
        }

        // Extract and unescape frame content
        const frameContent = HDLCFrame.unescapeFrame(buffer.slice(start + 1, end));

        // Validate checksums
        const hcs = frameContent.readUInt16LE(5);
        const calculatedHCS = HDLCFrame.calculateHCS(frameContent.slice(0, 5));
        if (hcs !== calculatedHCS) {
            throw new Error('Invalid frame: HCS mismatch');
        }

        const fcs = frameContent.readUInt16LE(frameContent.length - 2);
        const calculatedFCS = HDLCFrame.calculateFCS(frameContent.slice(0, -2));
        if (fcs !== calculatedFCS) {
            throw new Error('Invalid frame: FCS mismatch');
        }

        // Parse frame components
        const format = frameContent[0] as FrameFormat;
        const destAddr: HDLCAddress = {
            upper: frameContent[1],
            lower: frameContent[2]
        };
        const srcAddr: HDLCAddress = {
            upper: frameContent[3],
            lower: frameContent[4]
        };
        const control = frameContent[5];

        // Parse control field
        let type: FrameType;
        let sendSeq = 0;
        let recvSeq = 0;
        const poll = (control & 0x10) !== 0;

        switch (format) {
            case FrameFormat.TYPE_1:
                type = FrameType.I_FRAME;
                sendSeq = (control >> 1) & 0x07;
                recvSeq = (control >> 5) & 0x07;
                break;
            case FrameFormat.TYPE_2:
                type = control & 0x0F;
                recvSeq = (control >> 5) & 0x07;
                break;
            case FrameFormat.TYPE_3:
                type = control & 0x8F;
                break;
            default:
                throw new Error('Invalid frame format');
        }

        // Extract data
        const data = frameContent.slice(7, -2);

        return new HDLCFrame(
            format,
            type,
            srcAddr,
            destAddr,
            data,
            sendSeq,
            recvSeq,
            poll,
            false
        );
    }

    /**
     * Calculate Header Check Sequence
     */
    private static calculateHCS(buffer: Buffer): number {
        return HDLCFrame.calculateCRC16(buffer);
    }

    /**
     * Calculate Frame Check Sequence
     */
    private static calculateFCS(buffer: Buffer): number {
        return HDLCFrame.calculateCRC16(buffer);
    }

    /**
     * Calculate CRC-16
     */
    private static calculateCRC16(buffer: Buffer): number {
        let crc = 0xFFFF;
        const polynomial = 0x8408;

        for (const byte of buffer) {
            crc ^= byte;
            for (let i = 0; i < 8; i++) {
                if ((crc & 0x0001) !== 0) {
                    crc = (crc >> 1) ^ polynomial;
                } else {
                    crc >>= 1;
                }
            }
        }

        return crc ^ 0xFFFF;
    }

    /**
     * Escape frame content
     */
    private escapeFrame(buffer: Buffer): Buffer {
        const result: number[] = [];

        for (const byte of buffer) {
            if (byte === FLAG || byte === ESCAPE) {
                result.push(ESCAPE);
                result.push(byte ^ ESCAPE_MASK);
            } else {
                result.push(byte);
            }
        }

        return Buffer.from(result);
    }

    /**
     * Unescape frame content
     */
    private static unescapeFrame(buffer: Buffer): Buffer {
        const result: number[] = [];
        let escaped = false;

        for (const byte of buffer) {
            if (escaped) {
                result.push(byte ^ ESCAPE_MASK);
                escaped = false;
            } else if (byte === ESCAPE) {
                escaped = true;
            } else {
                result.push(byte);
            }
        }

        if (escaped) {
            throw new Error('Invalid frame: incomplete escape sequence');
        }

        return Buffer.from(result);
    }
} 