import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel, SecurityLevel, AuthenticationType } from '../data/Types';

interface SecurityPolicy {
    id: number;
    version: number;
    enabled: boolean;
}

interface SecuritySuite {
    id: number;
    encryptionAlgorithm: string;
    authenticationAlgorithm: string;
    keyAgreementAlgorithm: string;
}

/**
 * Security Setup Class (IC: 64)
 * Manages security features and settings
 */
export class SecuritySetup extends CosemInterfaceClass {
    private securityPolicy: number;
    private securitySuite: number;
    private clientSystemTitle: Buffer;
    private serverSystemTitle: Buffer;
    private masterKey: Buffer;
    private authenticationKey: Buffer;
    private encryptionKey: Buffer;
    private securityPolicies: SecurityPolicy[];
    private securitySuites: SecuritySuite[];

    constructor(logicalName: ObisCode) {
        super(logicalName, 64);
        this.securityPolicy = 0;
        this.securitySuite = 0;
        this.clientSystemTitle = Buffer.alloc(8);
        this.serverSystemTitle = Buffer.alloc(8);
        this.masterKey = Buffer.alloc(16);
        this.authenticationKey = Buffer.alloc(16);
        this.encryptionKey = Buffer.alloc(16);
        this.securityPolicies = this.getDefaultSecurityPolicies();
        this.securitySuites = this.getDefaultSecuritySuites();
        this.initializeAttributes();
    }

    private initializeAttributes(): void {
        // Attribute 2: security_policy
        this.addAttribute(2, {
            name: 'security_policy',
            type: 'enum',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.securityPolicy,
            setValue: (value: number) => {
                this.securityPolicy = value;
            }
        });

        // Attribute 3: security_suite
        this.addAttribute(3, {
            name: 'security_suite',
            type: 'enum',
            access: AccessLevel.READ_WRITE,
            getValue: () => this.securitySuite,
            setValue: (value: number) => {
                this.securitySuite = value;
            }
        });

        // Attribute 4: client_system_title
        this.addAttribute(4, {
            name: 'client_system_title',
            type: 'octet-string',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.clientSystemTitle
        });

        // Attribute 5: server_system_title
        this.addAttribute(5, {
            name: 'server_system_title',
            type: 'octet-string',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.serverSystemTitle
        });

        // Add security_activate method
        this.addMethod(1, {
            name: 'security_activate',
            execute: (securityPolicy: number) => this.activateSecurity(securityPolicy)
        });

        // Add key_transfer method
        this.addMethod(2, {
            name: 'key_transfer',
            execute: (keyId: number, key: Buffer) => this.updateKey(keyId, key)
        });

        // Add key_agreement method
        this.addMethod(3, {
            name: 'key_agreement',
            execute: (keyId: number, data: Buffer) => this.performKeyAgreement(keyId, data)
        });

        // Add generate_key_pair method
        this.addMethod(4, {
            name: 'generate_key_pair',
            execute: (keyId: number) => this.generateKeyPair(keyId)
        });
    }

    private getDefaultSecurityPolicies(): SecurityPolicy[] {
        return [
            { id: 0, version: 0, enabled: true },  // Nothing
            { id: 1, version: 0, enabled: true },  // All messages authenticated
            { id: 2, version: 0, enabled: true },  // All messages encrypted
            { id: 3, version: 0, enabled: true }   // All messages authenticated and encrypted
        ];
    }

    private getDefaultSecuritySuites(): SecuritySuite[] {
        return [
            {
                id: 0,
                encryptionAlgorithm: 'AES-GCM-128',
                authenticationAlgorithm: 'GMAC',
                keyAgreementAlgorithm: 'ECDH'
            }
        ];
    }

    /**
     * Activate security policy
     */
    private activateSecurity(securityPolicy: number): void {
        const policy = this.securityPolicies.find(p => p.id === securityPolicy);
        if (!policy || !policy.enabled) {
            throw new Error(`Invalid or disabled security policy: ${securityPolicy}`);
        }
        this.securityPolicy = securityPolicy;
    }

    /**
     * Update security key
     */
    private updateKey(keyId: number, key: Buffer): void {
        switch (keyId) {
            case 0:
                this.masterKey = Buffer.from(key);
                break;
            case 1:
                this.authenticationKey = Buffer.from(key);
                break;
            case 2:
                this.encryptionKey = Buffer.from(key);
                break;
            default:
                throw new Error(`Invalid key ID: ${keyId}`);
        }
    }

    /**
     * Perform key agreement
     */
    private performKeyAgreement(keyId: number, data: Buffer): Buffer {
        // In real implementation, this would perform ECDH key agreement
        return Buffer.alloc(0);
    }

    /**
     * Generate key pair
     */
    private generateKeyPair(keyId: number): { publicKey: Buffer; privateKey: Buffer } {
        // In real implementation, this would generate ECDH key pair
        return {
            publicKey: Buffer.alloc(0),
            privateKey: Buffer.alloc(0)
        };
    }

    /**
     * Get current security suite
     */
    public getCurrentSecuritySuite(): SecuritySuite {
        const suite = this.securitySuites.find(s => s.id === this.securitySuite);
        if (!suite) {
            throw new Error(`Invalid security suite: ${this.securitySuite}`);
        }
        return suite;
    }

    /**
     * Get current security policy
     */
    public getCurrentSecurityPolicy(): SecurityPolicy {
        const policy = this.securityPolicies.find(p => p.id === this.securityPolicy);
        if (!policy) {
            throw new Error(`Invalid security policy: ${this.securityPolicy}`);
        }
        return policy;
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `Security Setup (Policy: ${this.securityPolicy}, Suite: ${this.securitySuite})`;
    }
} 