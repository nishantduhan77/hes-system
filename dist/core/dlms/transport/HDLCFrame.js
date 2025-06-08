"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDLCFrame = exports.ESCAPE_MASK = exports.ESCAPE = exports.FLAG = exports.FrameType = exports.FrameFormat = void 0;
/**
 * HDLC Frame Format Types
 */
var FrameFormat;
(function (FrameFormat) {
    FrameFormat[FrameFormat["TYPE_1"] = 160] = "TYPE_1";
    FrameFormat[FrameFormat["TYPE_2"] = 176] = "TYPE_2";
    FrameFormat[FrameFormat["TYPE_3"] = 192] = "TYPE_3";
})(FrameFormat || (exports.FrameFormat = FrameFormat = {}));
/**
 * HDLC Frame Types
 */
var FrameType;
(function (FrameType) {
    FrameType[FrameType["I_FRAME"] = 0] = "I_FRAME";
    FrameType[FrameType["RR"] = 1] = "RR";
    FrameType[FrameType["RNR"] = 5] = "RNR";
    FrameType[FrameType["REJ"] = 9] = "REJ";
    FrameType[FrameType["SNRM"] = 131] = "SNRM";
    FrameType[FrameType["UA"] = 99] = "UA";
    FrameType[FrameType["DM"] = 15] = "DM";
    FrameType[FrameType["DISC"] = 67] = "DISC";
    FrameType[FrameType["FRMR"] = 135] = "FRMR"; // Frame reject
})(FrameType || (exports.FrameType = FrameType = {}));
exports.FLAG = 0x7E;
exports.ESCAPE = 0x7D;
exports.ESCAPE_MASK = 0x20;
/**
 * HDLC Frame Implementation
 */
class HDLCFrame {
    constructor(format, type, sourceAddress, destinationAddress, data = Buffer.alloc(0), sendSequence = 0, receiveSequence = 0, poll = false, final = false) {
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
    getFormat() {
        return this.format;
    }
    /**
     * Get frame type
     */
    getType() {
        return this.type;
    }
    /**
     * Get source address
     */
    getSourceAddress() {
        return { ...this.sourceAddress };
    }
    /**
     * Get destination address
     */
    getDestinationAddress() {
        return { ...this.destinationAddress };
    }
    /**
     * Get frame data
     */
    getData() {
        return Buffer.from(this.data);
    }
    /**
     * Get send sequence number
     */
    getSendSequence() {
        return this.sendSequence;
    }
    /**
     * Get receive sequence number
     */
    getReceiveSequence() {
        return this.receiveSequence;
    }
    /**
     * Get poll flag
     */
    isPoll() {
        return this.poll;
    }
    /**
     * Get final flag
     */
    isFinal() {
        return this.final;
    }
    /**
     * Encode frame to buffer
     */
    encode() {
        // Frame format:
        // [Flag] [Frame Format] [Dest Addr] [Src Addr] [Control] [HCS] [Data] [FCS] [Flag]
        // Calculate control field
        let control;
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
            Buffer.from([exports.FLAG]),
            frame,
            Buffer.from([hcs & 0xFF, (hcs >> 8) & 0xFF]),
            Buffer.from([fcs & 0xFF, (fcs >> 8) & 0xFF]),
            Buffer.from([exports.FLAG])
        ]);
        return this.escapeFrame(completeFrame);
    }
    /**
     * Decode frame from buffer
     */
    static decode(buffer) {
        // Find start and end flags
        let start = buffer.indexOf(exports.FLAG);
        let end = buffer.lastIndexOf(exports.FLAG);
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
        const format = frameContent[0];
        const destAddr = {
            upper: frameContent[1],
            lower: frameContent[2]
        };
        const srcAddr = {
            upper: frameContent[3],
            lower: frameContent[4]
        };
        const control = frameContent[5];
        // Parse control field
        let type;
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
        return new HDLCFrame(format, type, srcAddr, destAddr, data, sendSeq, recvSeq, poll, false);
    }
    /**
     * Calculate Header Check Sequence
     */
    static calculateHCS(buffer) {
        return HDLCFrame.calculateCRC16(buffer);
    }
    /**
     * Calculate Frame Check Sequence
     */
    static calculateFCS(buffer) {
        return HDLCFrame.calculateCRC16(buffer);
    }
    /**
     * Calculate CRC-16
     */
    static calculateCRC16(buffer) {
        let crc = 0xFFFF;
        const polynomial = 0x8408;
        for (const byte of buffer) {
            crc ^= byte;
            for (let i = 0; i < 8; i++) {
                if ((crc & 0x0001) !== 0) {
                    crc = (crc >> 1) ^ polynomial;
                }
                else {
                    crc >>= 1;
                }
            }
        }
        return crc ^ 0xFFFF;
    }
    /**
     * Escape frame content
     */
    escapeFrame(buffer) {
        const result = [];
        for (const byte of buffer) {
            if (byte === exports.FLAG || byte === exports.ESCAPE) {
                result.push(exports.ESCAPE);
                result.push(byte ^ exports.ESCAPE_MASK);
            }
            else {
                result.push(byte);
            }
        }
        return Buffer.from(result);
    }
    /**
     * Unescape frame content
     */
    static unescapeFrame(buffer) {
        const result = [];
        let escaped = false;
        for (const byte of buffer) {
            if (escaped) {
                result.push(byte ^ exports.ESCAPE_MASK);
                escaped = false;
            }
            else if (byte === exports.ESCAPE) {
                escaped = true;
            }
            else {
                result.push(byte);
            }
        }
        if (escaped) {
            throw new Error('Invalid frame: incomplete escape sequence');
        }
        return Buffer.from(result);
    }
}
exports.HDLCFrame = HDLCFrame;
