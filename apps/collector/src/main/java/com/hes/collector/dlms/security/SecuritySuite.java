package com.hes.collector.dlms.security;

import lombok.Getter;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.util.Arrays;

@Getter
public class SecuritySuite {
    public enum SecurityPolicy {
        NONE(0),
        AUTHENTICATION(1),
        ENCRYPTION(2),
        AUTHENTICATION_ENCRYPTION(3);

        private final int value;

        SecurityPolicy(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }
    }

    public enum SecurityVersion {
        NONE(0),
        V1(1),
        V2(2);

        private final int value;

        SecurityVersion(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }
    }

    private final SecurityPolicy securityPolicy;
    private final SecurityVersion securityVersion;
    private final byte[] authenticationKey;
    private final byte[] encryptionKey;
    private final byte[] systemTitle;
    private final byte[] frameCounter;

    private SecuritySuite(SecurityPolicy securityPolicy, SecurityVersion securityVersion,
                         byte[] authenticationKey, byte[] encryptionKey, 
                         byte[] systemTitle, byte[] frameCounter) {
        this.securityPolicy = securityPolicy;
        this.securityVersion = securityVersion;
        this.authenticationKey = authenticationKey != null ? authenticationKey.clone() : new byte[0];
        this.encryptionKey = encryptionKey != null ? encryptionKey.clone() : new byte[0];
        this.systemTitle = systemTitle != null ? systemTitle.clone() : new byte[8];
        this.frameCounter = frameCounter != null ? frameCounter.clone() : new byte[4];
    }

    public byte[] authenticate(byte[] data) throws Exception {
        if (securityPolicy == SecurityPolicy.NONE) {
            return data;
        }

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data);
        return Arrays.copyOf(hash, 8); // Use first 8 bytes as authentication tag
    }

    public byte[] encrypt(byte[] data) throws Exception {
        if (securityPolicy != SecurityPolicy.ENCRYPTION && 
            securityPolicy != SecurityPolicy.AUTHENTICATION_ENCRYPTION) {
            return data;
        }

        // Use AES in GCM mode for authenticated encryption
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        SecretKeySpec keySpec = new SecretKeySpec(encryptionKey, "AES");
        
        // Create IV using system title and frame counter
        byte[] iv = new byte[12];
        System.arraycopy(systemTitle, 0, iv, 0, 8);
        System.arraycopy(frameCounter, 0, iv, 8, 4);
        
        GCMParameterSpec gcmSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);
        return cipher.doFinal(data);
    }

    public byte[] decrypt(byte[] data) throws Exception {
        if (securityPolicy != SecurityPolicy.ENCRYPTION && 
            securityPolicy != SecurityPolicy.AUTHENTICATION_ENCRYPTION) {
            return data;
        }

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        SecretKeySpec keySpec = new SecretKeySpec(encryptionKey, "AES");
        
        byte[] iv = new byte[12];
        System.arraycopy(systemTitle, 0, iv, 0, 8);
        System.arraycopy(frameCounter, 0, iv, 8, 4);
        
        GCMParameterSpec gcmSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);
        return cipher.doFinal(data);
    }

    public void incrementFrameCounter() {
        for (int i = frameCounter.length - 1; i >= 0; i--) {
            if (++frameCounter[i] != 0) {
                break;
            }
        }
    }

    public static SecuritySuite noSecurity() {
        return new SecuritySuite(
            SecurityPolicy.NONE,
            SecurityVersion.NONE,
            new byte[0],
            new byte[0],
            new byte[8],
            new byte[4]
        );
    }

    public static SecuritySuite lowLevelSecurity(byte[] authKey) {
        return new SecuritySuite(
            SecurityPolicy.AUTHENTICATION,
            SecurityVersion.V1,
            authKey,
            new byte[0],
            new byte[8],
            new byte[4]
        );
    }

    public static SecuritySuite highLevelSecurity(byte[] authKey, byte[] encKey, byte[] sysTitle) {
        return new SecuritySuite(
            SecurityPolicy.AUTHENTICATION_ENCRYPTION,
            SecurityVersion.V2,
            authKey,
            encKey,
            sysTitle,
            new byte[4]
        );
    }
} 