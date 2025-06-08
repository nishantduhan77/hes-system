"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APdu = exports.APduType = void 0;
/**
 * APDU Types
 */
var APduType;
(function (APduType) {
    APduType[APduType["INITIATE_REQUEST"] = 1] = "INITIATE_REQUEST";
    APduType[APduType["INITIATE_RESPONSE"] = 8] = "INITIATE_RESPONSE";
    APduType[APduType["READ_REQUEST"] = 192] = "READ_REQUEST";
    APduType[APduType["READ_RESPONSE"] = 196] = "READ_RESPONSE";
    APduType[APduType["WRITE_REQUEST"] = 193] = "WRITE_REQUEST";
    APduType[APduType["WRITE_RESPONSE"] = 197] = "WRITE_RESPONSE";
    APduType[APduType["ACTION_REQUEST"] = 195] = "ACTION_REQUEST";
    APduType[APduType["ACTION_RESPONSE"] = 199] = "ACTION_RESPONSE";
    APduType[APduType["GET_REQUEST"] = 192] = "GET_REQUEST";
    APduType[APduType["GET_RESPONSE"] = 196] = "GET_RESPONSE";
    APduType[APduType["SET_REQUEST"] = 193] = "SET_REQUEST";
    APduType[APduType["SET_RESPONSE"] = 197] = "SET_RESPONSE";
    APduType[APduType["EVENT_NOTIFICATION"] = 194] = "EVENT_NOTIFICATION";
    APduType[APduType["CONFIRMED_SERVICE_ERROR"] = 224] = "CONFIRMED_SERVICE_ERROR";
    APduType[APduType["EXCEPTION_RESPONSE"] = 208] = "EXCEPTION_RESPONSE";
    APduType[APduType["GENERAL_BLOCK_TRANSFER"] = 224] = "GENERAL_BLOCK_TRANSFER";
})(APduType || (exports.APduType = APduType = {}));
/**
 * Application Protocol Data Unit Implementation
 */
class APdu {
    constructor(type, header, data) {
        this.type = type;
        this.header = header;
        this.data = data;
    }
    /**
     * Encode APDU to buffer
     */
    encode() {
        const buffer = Buffer.alloc(1024); // Initial buffer size
        let offset = 0;
        // Write APDU type
        buffer.writeUInt8(this.type, offset++);
        // Write control field
        const control = this.encodeControl(this.header.control);
        buffer.writeUInt8(control, offset++);
        // Write invoke ID
        buffer.writeUInt8(this.header.invokeId, offset++);
        // Write block numbers if present
        if (this.header.blockNumber !== undefined) {
            buffer.writeUInt32BE(this.header.blockNumber, offset);
            offset += 4;
        }
        if (this.header.blockNumberAck !== undefined) {
            buffer.writeUInt32BE(this.header.blockNumberAck, offset);
            offset += 4;
        }
        // Write data
        this.data.copy(buffer, offset);
        offset += this.data.length;
        return buffer.slice(0, offset);
    }
    /**
     * Decode buffer to APDU
     */
    static decode(buffer) {
        let offset = 0;
        // Read APDU type
        const type = buffer.readUInt8(offset++);
        // Read control field
        const controlByte = buffer.readUInt8(offset++);
        const control = APdu.decodeControl(controlByte);
        // Read invoke ID
        const invokeId = buffer.readUInt8(offset++);
        // Read block numbers if present
        let blockNumber, blockNumberAck;
        if (control.isSegmented) {
            blockNumber = buffer.readUInt32BE(offset);
            offset += 4;
            blockNumberAck = buffer.readUInt32BE(offset);
            offset += 4;
        }
        // Create header
        const header = {
            type,
            control,
            invokeId,
            blockNumber,
            blockNumberAck
        };
        // Read data
        const data = buffer.slice(offset);
        return new APdu(type, header, data);
    }
    /**
     * Get APDU type
     */
    getType() {
        return this.type;
    }
    /**
     * Get APDU header
     */
    getHeader() {
        return this.header;
    }
    /**
     * Get APDU data
     */
    getData() {
        return this.data;
    }
    /**
     * Encode control field
     */
    encodeControl(control) {
        let value = 0;
        if (control.isSegmented)
            value |= 0x80;
        if (control.lastSegment)
            value |= 0x40;
        value |= (control.segmentNumber & 0x0F) << 2;
        value |= control.serviceType & 0x03;
        return value;
    }
    /**
     * Decode control field
     */
    static decodeControl(value) {
        return {
            isSegmented: (value & 0x80) !== 0,
            lastSegment: (value & 0x40) !== 0,
            segmentNumber: (value >> 2) & 0x0F,
            serviceType: value & 0x03
        };
    }
    /**
     * Create GET request APDU
     */
    static createGetRequest(invokeId, data) {
        const header = {
            type: APduType.GET_REQUEST,
            control: {
                isSegmented: false,
                lastSegment: true,
                segmentNumber: 0,
                serviceType: 0
            },
            invokeId
        };
        return new APdu(APduType.GET_REQUEST, header, data);
    }
    /**
     * Create SET request APDU
     */
    static createSetRequest(invokeId, data) {
        const header = {
            type: APduType.SET_REQUEST,
            control: {
                isSegmented: false,
                lastSegment: true,
                segmentNumber: 0,
                serviceType: 0
            },
            invokeId
        };
        return new APdu(APduType.SET_REQUEST, header, data);
    }
    /**
     * Create ACTION request APDU
     */
    static createActionRequest(invokeId, data) {
        const header = {
            type: APduType.ACTION_REQUEST,
            control: {
                isSegmented: false,
                lastSegment: true,
                segmentNumber: 0,
                serviceType: 0
            },
            invokeId
        };
        return new APdu(APduType.ACTION_REQUEST, header, data);
    }
}
exports.APdu = APdu;
