"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("./types");
const x509 = __importStar(require("@peculiar/x509"));
class CertificateManager {
    constructor() { }
    static getInstance() {
        if (!CertificateManager.instance) {
            CertificateManager.instance = new CertificateManager();
        }
        return CertificateManager.instance;
    }
    /**
     * Generate a new certificate
     */
    async generateCertificate(entityId, type, validityDays) {
        try {
            // Generate key pair
            const alg = {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256",
                publicExponent: new Uint8Array([1, 0, 1]),
                modulusLength: 2048,
            };
            const keys = await crypto_1.default.subtle.generateKey(alg, false, ["sign", "verify"]);
            // Calculate validity period
            const now = new Date();
            const validFrom = now;
            const validTo = new Date(now.getTime() + (validityDays * 24 * 60 * 60 * 1000));
            // Create certificate using @peculiar/x509
            const cert = await x509.X509CertificateGenerator.createSelfSigned({
                serialNumber: this.generateSerialNumber(),
                name: `CN=DLMS-${type}-${entityId}, O=DLMS/COSEM Simulator`,
                notBefore: validFrom,
                notAfter: validTo,
                signingAlgorithm: alg,
                keys,
                extensions: [
                    new x509.BasicConstraintsExtension(true, 2, true),
                    new x509.KeyUsagesExtension(x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign, true),
                    await x509.SubjectKeyIdentifierExtension.create(keys.publicKey)
                ]
            });
            // Store certificate in database
            await this.storeCertificate({
                entityId,
                type,
                certificateData: Buffer.from(cert.toString()),
                validFrom,
                validTo
            });
            return Buffer.from(cert.toString());
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to generate certificate: ${error.message}`);
        }
    }
    /**
     * Generate a random serial number for the certificate
     */
    generateSerialNumber() {
        return crypto_1.default.randomBytes(16).toString('hex');
    }
    /**
     * Store certificate in database
     */
    async storeCertificate(certData) {
        // Implementation for storing certificate in database
        // This will be implemented when we have database connection
    }
    /**
     * Verify certificate
     */
    async verifyCertificate(certificate) {
        try {
            const cert = new x509.X509Certificate(certificate);
            // Check validity period
            const now = new Date();
            if (now < cert.notBefore || now > cert.notAfter) {
                return false;
            }
            // Verify certificate chain
            // This is a simplified check. In production, you would:
            // 1. Verify against trusted root certificates
            // 2. Check certificate revocation lists (CRL)
            // 3. Check Online Certificate Status Protocol (OCSP)
            return true;
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to verify certificate: ${error.message}`);
        }
    }
    /**
     * Revoke certificate
     */
    async revokeCertificate(certificateId) {
        try {
            // 1. Update certificate status in database to REVOKED
            // 2. Add to certificate revocation list
            // 3. Generate new CRL
            // 4. Notify relevant parties
            // Implementation will be added when database connection is available
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to revoke certificate: ${error.message}`);
        }
    }
    /**
     * Get certificate information
     */
    async getCertificateInfo(certificate) {
        try {
            const cert = new x509.X509Certificate(certificate);
            return {
                subject: cert.subject,
                issuer: cert.issuer,
                validFrom: cert.notBefore,
                validTo: cert.notAfter,
                serialNumber: cert.serialNumber
            };
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to get certificate info: ${error.message}`);
        }
    }
}
exports.CertificateManager = CertificateManager;
