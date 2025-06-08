"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecuritySetup = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const Types_1 = require("../data/Types");
/**
 * Security Setup Class (IC: 64)
 * Manages security features and settings
 */
class SecuritySetup extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName) {
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
    initializeAttributes() {
        // Attribute 2: security_policy
        this.addAttribute(2, {
            name: 'security_policy',
            type: 'enum',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.securityPolicy,
            setValue: (value) => {
                this.securityPolicy = value;
            }
        });
        // Attribute 3: security_suite
        this.addAttribute(3, {
            name: 'security_suite',
            type: 'enum',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.securitySuite,
            setValue: (value) => {
                this.securitySuite = value;
            }
        });
        // Attribute 4: client_system_title
        this.addAttribute(4, {
            name: 'client_system_title',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.clientSystemTitle
        });
        // Attribute 5: server_system_title
        this.addAttribute(5, {
            name: 'server_system_title',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.serverSystemTitle
        });
        // Add security_activate method
        this.addMethod(1, {
            name: 'security_activate',
            execute: (securityPolicy) => this.activateSecurity(securityPolicy)
        });
        // Add key_transfer method
        this.addMethod(2, {
            name: 'key_transfer',
            execute: (keyId, key) => this.updateKey(keyId, key)
        });
        // Add key_agreement method
        this.addMethod(3, {
            name: 'key_agreement',
            execute: (keyId, data) => this.performKeyAgreement(keyId, data)
        });
        // Add generate_key_pair method
        this.addMethod(4, {
            name: 'generate_key_pair',
            execute: (keyId) => this.generateKeyPair(keyId)
        });
    }
    getDefaultSecurityPolicies() {
        return [
            { id: 0, version: 0, enabled: true }, // Nothing
            { id: 1, version: 0, enabled: true }, // All messages authenticated
            { id: 2, version: 0, enabled: true }, // All messages encrypted
            { id: 3, version: 0, enabled: true } // All messages authenticated and encrypted
        ];
    }
    getDefaultSecuritySuites() {
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
    activateSecurity(securityPolicy) {
        const policy = this.securityPolicies.find(p => p.id === securityPolicy);
        if (!policy || !policy.enabled) {
            throw new Error(`Invalid or disabled security policy: ${securityPolicy}`);
        }
        this.securityPolicy = securityPolicy;
    }
    /**
     * Update security key
     */
    updateKey(keyId, key) {
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
    performKeyAgreement(keyId, data) {
        // In real implementation, this would perform ECDH key agreement
        return Buffer.alloc(0);
    }
    /**
     * Generate key pair
     */
    generateKeyPair(keyId) {
        // In real implementation, this would generate ECDH key pair
        return {
            publicKey: Buffer.alloc(0),
            privateKey: Buffer.alloc(0)
        };
    }
    /**
     * Get current security suite
     */
    getCurrentSecuritySuite() {
        const suite = this.securitySuites.find(s => s.id === this.securitySuite);
        if (!suite) {
            throw new Error(`Invalid security suite: ${this.securitySuite}`);
        }
        return suite;
    }
    /**
     * Get current security policy
     */
    getCurrentSecurityPolicy() {
        const policy = this.securityPolicies.find(p => p.id === this.securityPolicy);
        if (!policy) {
            throw new Error(`Invalid security policy: ${this.securityPolicy}`);
        }
        return policy;
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `Security Setup (Policy: ${this.securityPolicy}, Suite: ${this.securitySuite})`;
    }
}
exports.SecuritySetup = SecuritySetup;
