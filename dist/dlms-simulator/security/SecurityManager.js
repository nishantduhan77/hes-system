"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("./types");
const CertificateManager_1 = require("./CertificateManager");
class SecurityManager {
    constructor() {
        this.encryptionKey = null;
        this.authenticationKey = null;
        this.masterKey = null;
        this.certificateManager = CertificateManager_1.CertificateManager.getInstance();
    }
    static getInstance() {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager();
        }
        return SecurityManager.instance;
    }
    /**
     * Initialize security with specific policy and suite
     */
    async initialize(policy, suite) {
        try {
            // Generate initial keys
            this.masterKey = await this.generateKey(32); // 256-bit key
            this.encryptionKey = await this.generateKey(16); // 128-bit key
            this.authenticationKey = await this.generateKey(16); // 128-bit key
            // Store security settings in database
            await this.storeSecuritySettings(policy, suite);
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to initialize security: ${error.message}`);
        }
    }
    /**
     * Generate cryptographic key
     */
    async generateKey(length) {
        return new Promise((resolve, reject) => {
            crypto_1.default.randomBytes(length, (err, buffer) => {
                if (err)
                    reject(new types_1.SecurityError(err.message));
                resolve(buffer);
            });
        });
    }
    /**
     * Store security settings in database
     */
    async storeSecuritySettings(policy, suite) {
        // Implementation for storing in database
        // This will be implemented when we have database connection
    }
    /**
     * Encrypt data using current encryption key
     */
    async encrypt(data) {
        if (!this.encryptionKey) {
            throw new types_1.SecurityError('Encryption key not initialized');
        }
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv('aes-128-gcm', this.encryptionKey, iv);
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
    async decrypt(encryptedData) {
        if (!this.encryptionKey) {
            throw new types_1.SecurityError('Encryption key not initialized');
        }
        // Extract IV, AuthTag and encrypted content
        const iv = encryptedData.slice(0, 16);
        const authTag = encryptedData.slice(16, 32);
        const encrypted = encryptedData.slice(32);
        const decipher = crypto_1.default.createDecipheriv('aes-128-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
    }
    /**
     * Generate authentication token
     */
    async generateAuthToken(clientId, timestamp) {
        if (!this.authenticationKey) {
            throw new types_1.SecurityError('Authentication key not initialized');
        }
        const hmac = crypto_1.default.createHmac('sha256', this.authenticationKey);
        hmac.update(Buffer.from(`${clientId}:${timestamp}`, 'utf8'));
        return hmac.digest();
    }
    /**
     * Verify authentication token
     */
    async verifyAuthToken(token, clientId, timestamp) {
        const expectedToken = await this.generateAuthToken(clientId, timestamp);
        return crypto_1.default.timingSafeEqual(token, expectedToken);
    }
    /**
     * Rotate encryption and authentication keys
     */
    async rotateKeys() {
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
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to rotate keys: ${error.message}`);
        }
    }
    /**
     * Update key change timestamp in database
     */
    async updateKeyChangeTimestamp() {
        // Implementation for updating timestamp in database
        // This will be implemented when we have database connection
    }
}
exports.SecurityManager = SecurityManager;
