import crypto from 'crypto';
import { CertificateType, SecurityError } from './types';
import * as x509 from '@peculiar/x509';

export class CertificateManager {
    private static instance: CertificateManager;

    private constructor() {}

    public static getInstance(): CertificateManager {
        if (!CertificateManager.instance) {
            CertificateManager.instance = new CertificateManager();
        }
        return CertificateManager.instance;
    }

    /**
     * Generate a new certificate
     */
    public async generateCertificate(
        entityId: number,
        type: CertificateType,
        validityDays: number
    ): Promise<Buffer> {
        try {
            // Generate key pair
            const alg = {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256",
                publicExponent: new Uint8Array([1, 0, 1]),
                modulusLength: 2048,
            };

            const keys = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);

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
                    new x509.KeyUsagesExtension(
                        x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
                        true
                    ),
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
        } catch (err) {
            const error = err as Error;
            throw new SecurityError(`Failed to generate certificate: ${error.message}`);
        }
    }

    /**
     * Generate a random serial number for the certificate
     */
    private generateSerialNumber(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Store certificate in database
     */
    private async storeCertificate(certData: {
        entityId: number;
        type: CertificateType;
        certificateData: Buffer;
        validFrom: Date;
        validTo: Date;
    }): Promise<void> {
        // Implementation for storing certificate in database
        // This will be implemented when we have database connection
    }

    /**
     * Verify certificate
     */
    public async verifyCertificate(certificate: Buffer): Promise<boolean> {
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
        } catch (err) {
            const error = err as Error;
            throw new SecurityError(`Failed to verify certificate: ${error.message}`);
        }
    }

    /**
     * Revoke certificate
     */
    public async revokeCertificate(certificateId: number): Promise<void> {
        try {
            // 1. Update certificate status in database to REVOKED
            // 2. Add to certificate revocation list
            // 3. Generate new CRL
            // 4. Notify relevant parties
            
            // Implementation will be added when database connection is available
        } catch (err) {
            const error = err as Error;
            throw new SecurityError(`Failed to revoke certificate: ${error.message}`);
        }
    }

    /**
     * Get certificate information
     */
    public async getCertificateInfo(certificate: Buffer): Promise<{
        subject: string;
        issuer: string;
        validFrom: Date;
        validTo: Date;
        serialNumber: string;
    }> {
        try {
            const cert = new x509.X509Certificate(certificate);
            return {
                subject: cert.subject,
                issuer: cert.issuer,
                validFrom: cert.notBefore,
                validTo: cert.notAfter,
                serialNumber: cert.serialNumber
            };
        } catch (err) {
            const error = err as Error;
            throw new SecurityError(`Failed to get certificate info: ${error.message}`);
        }
    }
} 