/**
 * Security Policy Levels as per DLMS/COSEM
 */
export enum SecurityPolicy {
    NONE = 0,            // No security
    AUTHENTICATED = 1,   // Authentication only
    ENCRYPTED = 2,       // Encryption only
    AUTH_ENCRYPTED = 3   // Authentication and Encryption
}

/**
 * Security Suite Options
 */
export enum SecuritySuite {
    AES_GCM_128 = 0,    // AES-GCM-128
    AES_GCM_256 = 1     // AES-GCM-256
}

/**
 * Certificate Types
 */
export enum CertificateType {
    DEVICE = 'DEVICE',
    AUTHORITY = 'AUTHORITY',
    CLIENT = 'CLIENT'
}

/**
 * Security Settings Interface
 */
export interface SecuritySettings {
    id: number;
    securityPolicy: SecurityPolicy;
    securitySuite: SecuritySuite;
    encryptionKey?: Buffer;
    authenticationKey?: Buffer;
    masterKey?: Buffer;
    globalKeyChangeInterval: number;
    lastKeyChange: Date;
    createdAt: Date;
}

/**
 * Certificate Interface
 */
export interface Certificate {
    id: number;
    entityId: number;
    certificateType: CertificateType;
    certificateData: Buffer;
    validFrom: Date;
    validUntil: Date;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    createdAt: Date;
}

/**
 * Access Rights Interface
 */
export interface AccessRights {
    id: number;
    objectId: number;
    clientId: number;
    accessLevel: number;
    attributeMask: bigint;
    methodMask: bigint;
    createdAt: Date;
}

/**
 * Error type for security operations
 */
export class SecurityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SecurityError';
    }
} 