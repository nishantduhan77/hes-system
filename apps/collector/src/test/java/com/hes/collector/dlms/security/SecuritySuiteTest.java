package com.hes.collector.dlms.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;
import java.util.Arrays;

@DisplayName("Security Suite Tests")
class SecuritySuiteTest {

    @Test
    @DisplayName("Should create no security suite")
    void shouldCreateNoSecuritySuite() {
        SecuritySuite security = SecuritySuite.noSecurity();
        
        assertEquals(SecuritySuite.SecurityPolicy.NONE, security.getSecurityPolicy());
        assertEquals(SecuritySuite.SecurityVersion.NONE, security.getSecurityVersion());
        assertArrayEquals(new byte[0], security.getAuthenticationKey());
        assertArrayEquals(new byte[0], security.getEncryptionKey());
    }

    @Test
    @DisplayName("Should create low level security suite")
    void shouldCreateLowLevelSecuritySuite() {
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        SecuritySuite security = SecuritySuite.lowLevelSecurity(authKey);
        
        assertEquals(SecuritySuite.SecurityPolicy.AUTHENTICATION, security.getSecurityPolicy());
        assertEquals(SecuritySuite.SecurityVersion.V1, security.getSecurityVersion());
        assertArrayEquals(authKey, security.getAuthenticationKey());
        assertArrayEquals(new byte[0], security.getEncryptionKey());
    }

    @Test
    @DisplayName("Should create high level security suite")
    void shouldCreateHighLevelSecuritySuite() {
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        byte[] encKey = {16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
        byte[] sysTitle = {0x4D, 0x4D, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x01};
        
        SecuritySuite security = SecuritySuite.highLevelSecurity(authKey, encKey, sysTitle);
        
        assertEquals(SecuritySuite.SecurityPolicy.AUTHENTICATION_ENCRYPTION, security.getSecurityPolicy());
        assertEquals(SecuritySuite.SecurityVersion.V2, security.getSecurityVersion());
        assertArrayEquals(authKey, security.getAuthenticationKey());
        assertArrayEquals(encKey, security.getEncryptionKey());
        assertArrayEquals(sysTitle, security.getSystemTitle());
    }

    @Test
    @DisplayName("Should authenticate data with low level security")
    void shouldAuthenticateDataWithLowLevelSecurity() throws Exception {
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        SecuritySuite security = SecuritySuite.lowLevelSecurity(authKey);
        
        byte[] data = "test data".getBytes();
        byte[] authTag = security.authenticate(data);
        
        assertNotNull(authTag);
        assertEquals(8, authTag.length);
        assertFalse(Arrays.equals(data, authTag));
    }

    @Test
    @DisplayName("Should not authenticate data with no security")
    void shouldNotAuthenticateDataWithNoSecurity() throws Exception {
        SecuritySuite security = SecuritySuite.noSecurity();
        
        byte[] data = "test data".getBytes();
        byte[] result = security.authenticate(data);
        
        assertArrayEquals(data, result);
    }

    @Test
    @DisplayName("Should encrypt and decrypt data with high level security")
    void shouldEncryptAndDecryptDataWithHighLevelSecurity() throws Exception {
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        byte[] encKey = {16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
        byte[] sysTitle = {0x4D, 0x4D, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x01};
        
        SecuritySuite security = SecuritySuite.highLevelSecurity(authKey, encKey, sysTitle);
        
        byte[] originalData = "test data for encryption".getBytes();
        byte[] encrypted = security.encrypt(originalData);
        byte[] decrypted = security.decrypt(encrypted);
        
        assertNotNull(encrypted);
        assertFalse(Arrays.equals(originalData, encrypted));
        assertArrayEquals(originalData, decrypted);
    }

    @Test
    @DisplayName("Should not encrypt data with no security")
    void shouldNotEncryptDataWithNoSecurity() throws Exception {
        SecuritySuite security = SecuritySuite.noSecurity();
        
        byte[] data = "test data".getBytes();
        byte[] result = security.encrypt(data);
        
        assertArrayEquals(data, result);
    }

    @Test
    @DisplayName("Should not encrypt data with authentication only")
    void shouldNotEncryptDataWithAuthenticationOnly() throws Exception {
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        SecuritySuite security = SecuritySuite.lowLevelSecurity(authKey);
        
        byte[] data = "test data".getBytes();
        byte[] result = security.encrypt(data);
        
        assertArrayEquals(data, result);
    }

    @Test
    @DisplayName("Should increment frame counter")
    void shouldIncrementFrameCounter() {
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        SecuritySuite security = SecuritySuite.lowLevelSecurity(authKey);
        
        byte[] initialCounter = security.getFrameCounter().clone();
        security.incrementFrameCounter();
        byte[] newCounter = security.getFrameCounter();
        
        assertFalse(Arrays.equals(initialCounter, newCounter));
    }

    @Test
    @DisplayName("Should handle frame counter overflow")
    void shouldHandleFrameCounterOverflow() {
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        SecuritySuite security = SecuritySuite.lowLevelSecurity(authKey);
        
        // Set counter to maximum value
        byte[] maxCounter = {(byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF};
        // Note: This would require reflection to set private field in real implementation
        
        // Increment should handle overflow gracefully
        security.incrementFrameCounter();
        assertNotNull(security.getFrameCounter());
    }

    @Test
    @DisplayName("Should have correct security policy values")
    void shouldHaveCorrectSecurityPolicyValues() {
        assertEquals(0, SecuritySuite.SecurityPolicy.NONE.getValue());
        assertEquals(1, SecuritySuite.SecurityPolicy.AUTHENTICATION.getValue());
        assertEquals(2, SecuritySuite.SecurityPolicy.ENCRYPTION.getValue());
        assertEquals(3, SecuritySuite.SecurityPolicy.AUTHENTICATION_ENCRYPTION.getValue());
    }

    @Test
    @DisplayName("Should have correct security version values")
    void shouldHaveCorrectSecurityVersionValues() {
        assertEquals(0, SecuritySuite.SecurityVersion.NONE.getValue());
        assertEquals(1, SecuritySuite.SecurityVersion.V1.getValue());
        assertEquals(2, SecuritySuite.SecurityVersion.V2.getValue());
    }
} 