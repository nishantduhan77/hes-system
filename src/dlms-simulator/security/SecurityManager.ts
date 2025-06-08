import crypto from 'crypto';
import { SecurityPolicy, SecuritySuite, SecurityError } from './types';
import { CertificateManager } from './CertificateManager';

export class SecurityManager {
    private static instance: SecurityManager;
    private encryptionKey: Buffer | null = null;
    private authenticationKey: Buffer | null = null;
    private masterKey: Buffer | null = null;
    private certificateManager: CertificateManager;

    private constructor() {
        this.certificateManager = CertificateManager.getInstance();
    }

    public static getInstance(): SecurityManager {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager();
        }
        return SecurityManager.instance;
    }

    /**
     * Initialize security with specific policy and suite
     */
    public async initialize(policy: SecurityPolicy, suite: SecuritySuite): Promise<void> {
        try {
            // Generate initial keys
            this.masterKey = await this.generateKey(32); // 256-bit key
            this.encryptionKey = await this.generateKey(16); // 128-bit key
            this.authenticationKey = await this.generateKey(16); // 128-bit key

            // Store security settings in database
            await this.storeSecuritySettings(policy, suite);
        } catch (err) {
            const error = err as SecurityError;
            throw new SecurityError(`Failed to initialize security: ${error.message}`);
        }
    }

    /**
     * Generate cryptographic key
     */
    private async generateKey(length: number): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(length, (err, buffer) => {
                if (err) reject(new SecurityError(err.message));
                resolve(buffer);
            });
        });
    }

    /**
     * Store security settings in database
     */
    private async storeSecuritySettings(policy: SecurityPolicy, suite: SecuritySuite): Promise<void> {
        // Implementation for storing in database
        // This will be implemented when we have database connection
    }

    /**
     * Encrypt data using current encryption key
     */
    public async encrypt(data: Buffer): Promise<Buffer> {
        if (!this.encryptionKey) {
            throw new SecurityError('Encryption key not initialized');
        }

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-128-gcm', this.encryptionKey, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(data),
            cipher.final()
        ]);

        const authTag = cipher.getAuthTag();
        
        // Return IV + AuthTag + Encrypted data
        return Buffer.concat([iv, authTag, encrypted]);
    }

    /**
     * Decrypt data using current encryption key
     */
    public async decrypt(encryptedData: Buffer): Promise<Buffer> {
        if (!this.encryptionKey) {
            throw new SecurityError('Encryption key not initialized');
        }

        // Extract IV, AuthTag and encrypted content
        const iv = encryptedData.slice(0, 16);
        const authTag = encryptedData.slice(16, 32);
        const encrypted = encryptedData.slice(32);

        const decipher = crypto.createDecipheriv('aes-128-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
    }

    /**
     * Generate authentication token
     */
    public async generateAuthToken(clientId: number, timestamp: number): Promise<Buffer> {
        if (!this.authenticationKey) {
            throw new SecurityError('Authentication key not initialized');
        }

        const hmac = crypto.createHmac('sha256', this.authenticationKey);
        hmac.update(Buffer.from(`${clientId}:${timestamp}`, 'utf8'));
        return hmac.digest();
    }

    /**
     * Verify authentication token
     */
    public async verifyAuthToken(token: Buffer, clientId: number, timestamp: number): Promise<boolean> {
        const expectedToken = await this.generateAuthToken(clientId, timestamp);
        return crypto.timingSafeEqual(token, expectedToken);
    }

    /**
     * Rotate encryption and authentication keys
     */
    public async rotateKeys(): Promise<void> {
        try {
            // Generate new keys
            const newEncryptionKey = await this.generateKey(16);
            const newAuthKey = await this.generateKey(16);

            // Backup old keys
            const oldEncryptionKey = this.encryptionKey;
            const oldAuthKey = this.authenticationKey;

            // Update current keys
            this.encryptionKey = newEncryptionKey;
            this.authenticationKey = newAuthKey;

            // Update key change timestamp in database
            await this.updateKeyChangeTimestamp();

            // TODO: Notify connected clients about key change
        } catch (err) {
            const error = err as SecurityError;
            throw new SecurityError(`Failed to rotate keys: ${error.message}`);
        }
    }

    /**
     * Update key change timestamp in database
     */
    private async updateKeyChangeTimestamp(): Promise<void> {
        // Implementation for updating timestamp in database
        // This will be implemented when we have database connection
    }
} 