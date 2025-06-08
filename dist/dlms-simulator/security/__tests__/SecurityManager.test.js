"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SecurityManager_1 = require("../SecurityManager");
const types_1 = require("../types");
describe('SecurityManager', () => {
    let securityManager;
    beforeEach(() => {
        securityManager = SecurityManager_1.SecurityManager.getInstance();
    });
    describe('initialization', () => {
        it('should initialize with security policy and suite', async () => {
            await expect(securityManager.initialize(types_1.SecurityPolicy.AUTH_ENCRYPTED, types_1.SecuritySuite.AES_GCM_128)).resolves.not.toThrow();
        });
    });
    describe('encryption and decryption', () => {
        beforeEach(async () => {
            await securityManager.initialize(types_1.SecurityPolicy.AUTH_ENCRYPTED, types_1.SecuritySuite.AES_GCM_128);
        });
        it('should encrypt and decrypt data correctly', async () => {
            const testData = Buffer.from('Test message');
            const encrypted = await securityManager.encrypt(testData);
            const decrypted = await securityManager.decrypt(encrypted);
            expect(decrypted.toString()).toBe(testData.toString());
        });
        it('should throw error when trying to encrypt without initialization', async () => {
            const newManager = SecurityManager_1.SecurityManager.getInstance();
            await expect(newManager.encrypt(Buffer.from('test')))
                .rejects
                .toThrow('Encryption key not initialized');
        });
    });
    describe('authentication', () => {
        beforeEach(async () => {
            await securityManager.initialize(types_1.SecurityPolicy.AUTH_ENCRYPTED, types_1.SecuritySuite.AES_GCM_128);
        });
        it('should generate and verify authentication token', async () => {
            const clientId = 1;
            const timestamp = Date.now();
            const token = await securityManager.generateAuthToken(clientId, timestamp);
            const isValid = await securityManager.verifyAuthToken(token, clientId, timestamp);
            expect(isValid).toBe(true);
        });
        it('should fail verification with wrong client ID', async () => {
            const clientId = 1;
            const wrongClientId = 2;
            const timestamp = Date.now();
            const token = await securityManager.generateAuthToken(clientId, timestamp);
            const isValid = await securityManager.verifyAuthToken(token, wrongClientId, timestamp);
            expect(isValid).toBe(false);
        });
    });
    describe('key rotation', () => {
        beforeEach(async () => {
            await securityManager.initialize(types_1.SecurityPolicy.AUTH_ENCRYPTED, types_1.SecuritySuite.AES_GCM_128);
        });
        it('should rotate keys successfully', async () => {
            const testData = Buffer.from('Test message');
            const encrypted = await securityManager.encrypt(testData);
            await securityManager.rotateKeys();
            // Should still be able to encrypt/decrypt with new keys
            const newEncrypted = await securityManager.encrypt(testData);
            const decrypted = await securityManager.decrypt(newEncrypted);
            expect(decrypted.toString()).toBe(testData.toString());
            // Encrypted data should be different after key rotation
            expect(encrypted).not.toEqual(newEncrypted);
        });
    });
});
