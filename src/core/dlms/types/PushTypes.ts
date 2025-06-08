/**
 * Push Object
 */
export interface PushObject {
    classId: number;
    logicalName: number[];
    attributeIndex: number;
    dataIndex?: number;
}

/**
 * Service Type
 */
export enum ServiceType {
    TCP = 0,
    UDP = 1,
    FTP = 2,
    SMTP = 3,
    SMS = 4,
    HDLC = 5,
    M_BUS = 6,
    ZIG_BEE = 7
}

/**
 * Message Type
 */
export enum MessageType {
    COSEM_APDU = 0,
    XML_ENCODED = 1,
    JSON_ENCODED = 2
}

/**
 * Communication Window
 */
export interface CommunicationWindow {
    startTime: Date;
    endTime: Date;
}

/**
 * Push Destination
 */
export interface PushDestination {
    transport: ServiceType;
    destination: string;
    message: MessageType;
    port?: number;
} 