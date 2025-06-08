/**
 * APDU Types
 */
export enum APduType {
    INITIATE_REQUEST = 0x01,
    INITIATE_RESPONSE = 0x08,
    READ_REQUEST = 0xC0,
    READ_RESPONSE = 0xC4,
    WRITE_REQUEST = 0xC1,
    WRITE_RESPONSE = 0xC5,
    ACTION_REQUEST = 0xC3,
    ACTION_RESPONSE = 0xC7,
    GET_REQUEST = 0xC0,
    GET_RESPONSE = 0xC4,
    SET_REQUEST = 0xC1,
    SET_RESPONSE = 0xC5,
    EVENT_NOTIFICATION = 0xC2,
    CONFIRMED_SERVICE_ERROR = 0xE0,
    EXCEPTION_RESPONSE = 0xD0,
    GENERAL_BLOCK_TRANSFER = 0xE0
}

/**
 * APDU Control Field
 */
export interface APduControl {
    isSegmented: boolean;
    lastSegment: boolean;
    segmentNumber: number;
    serviceType: number;
}

/**
 * APDU Header
 */
export interface APduHeader {
    type: APduType;
    control: APduControl;
    invokeId: number;
    blockNumber?: number;
    blockNumberAck?: number;
}

/**
 * Application Protocol Data Unit Implementation
 */
export class APdu {
    private type: APduType;
    private header: APduHeader;
    private data: Buffer;

    constructor(type: APduType, header: APduHeader, data: Buffer) {
        this.type = type;
        this.header = header;
        this.data = data;
    }

    /**
     * Encode APDU to buffer
     */
    public encode(): Buffer {
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
    public static decode(buffer: Buffer): APdu {
        let offset = 0;

        // Read APDU type
        const type = buffer.readUInt8(offset++) as APduType;

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
        const header: APduHeader = {
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
    public getType(): APduType {
        return this.type;
    }

    /**
     * Get APDU header
     */
    public getHeader(): APduHeader {
        return this.header;
    }

    /**
     * Get APDU data
     */
    public getData(): Buffer {
        return this.data;
    }

    /**
     * Encode control field
     */
    private encodeControl(control: APduControl): number {
        let value = 0;
        if (control.isSegmented) value |= 0x80;
        if (control.lastSegment) value |= 0x40;
        value |= (control.segmentNumber & 0x0F) << 2;
        value |= control.serviceType & 0x03;
        return value;
    }

    /**
     * Decode control field
     */
    private static decodeControl(value: number): APduControl {
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
    public static createGetRequest(invokeId: number, data: Buffer): APdu {
        const header: APduHeader = {
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
    public static createSetRequest(invokeId: number, data: Buffer): APdu {
        const header: APduHeader = {
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
    public static createActionRequest(invokeId: number, data: Buffer): APdu {
        const header: APduHeader = {
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