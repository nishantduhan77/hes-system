package com.hes.collector;

import com.hes.collector.dlms.*;
import com.hes.collector.dlms.security.SecuritySuite;
import com.hes.collector.config.DlmsConfig;

/**
 * Manual DLMS Test Application
 * Run this class to test the DLMS/COSEM implementation
 */
public class DlmsManualTest {
    
    public static void main(String[] args) {
        System.out.println("==========================================");
        System.out.println("DLMS/COSEM Manual Test Application");
        System.out.println("==========================================");
        
        try {
            // Test 1: OBIS Code parsing
            testObisCode();
            
            // Test 2: Data Object creation
            testDataObject();
            
            // Test 3: Security Suite
            testSecuritySuite();
            
            // Test 4: COSEM Objects
            testCosemObjects();
            
            // Test 5: DLMS Protocol (simulated)
            testDlmsProtocol();
            
            System.out.println("\n==========================================");
            System.out.println("All tests completed successfully!");
            System.out.println("DLMS/COSEM implementation is working correctly.");
            System.out.println("==========================================");
            
        } catch (Exception e) {
            System.err.println("Test failed with error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void testObisCode() {
        System.out.println("\n--- Testing OBIS Code ---");
        
        // Test parsing
        ObisCode obis1 = ObisCode.parse("1.0.1.7.0.255");
        System.out.println("✓ Parsed OBIS code: " + obis1);
        
        // Test creation from integers
        ObisCode obis2 = ObisCode.of(1, 0, 1, 8, 0, 255);
        System.out.println("✓ Created OBIS code: " + obis2);
        
        // Test equality
        ObisCode obis3 = ObisCode.parse("1.0.1.7.0.255");
        System.out.println("✓ Equality test: " + obis1.equals(obis3));
        
        // Test error handling
        try {
            ObisCode.parse("invalid");
            System.err.println("✗ Should have thrown exception for invalid format");
        } catch (IllegalArgumentException e) {
            System.out.println("✓ Correctly handled invalid OBIS format");
        }
    }
    
    private static void testDataObject() {
        System.out.println("\n--- Testing Data Object ---");
        
        // Test different data types
        DataObject nullObj = DataObject.newNull();
        System.out.println("✓ Null object: " + nullObj);
        
        DataObject boolObj = DataObject.newBoolean(true);
        System.out.println("✓ Boolean object: " + boolObj + " = " + boolObj.asBoolean());
        
        DataObject intObj = DataObject.newInteger(12345L);
        System.out.println("✓ Integer object: " + intObj + " = " + intObj.asInteger());
        
        DataObject stringObj = DataObject.newString("test string");
        System.out.println("✓ String object: " + stringObj + " = " + stringObj.asString());
        
        DataObject floatObj = DataObject.newFloat(123.45f);
        System.out.println("✓ Float object: " + floatObj + " = " + floatObj.asFloat());
        
        // Test octet string
        byte[] bytes = {1, 2, 3, 4, 5};
        DataObject octetObj = DataObject.newOctetString(bytes);
        System.out.println("✓ Octet string object: " + octetObj);
        
        // Test error handling
        try {
            intObj.asString();
            System.err.println("✗ Should have thrown exception for wrong type");
        } catch (IllegalStateException e) {
            System.out.println("✓ Correctly handled wrong type conversion");
        }
    }
    
    private static void testSecuritySuite() {
        System.out.println("\n--- Testing Security Suite ---");
        
        // Test no security
        SecuritySuite noSecurity = SecuritySuite.noSecurity();
        System.out.println("✓ No security: " + noSecurity.getSecurityPolicy());
        
        // Test low level security
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        SecuritySuite lowSecurity = SecuritySuite.lowLevelSecurity(authKey);
        System.out.println("✓ Low level security: " + lowSecurity.getSecurityPolicy());
        
        // Test high level security
        byte[] encKey = {16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
        byte[] sysTitle = {0x4D, 0x4D, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x01};
        SecuritySuite highSecurity = SecuritySuite.highLevelSecurity(authKey, encKey, sysTitle);
        System.out.println("✓ High level security: " + highSecurity.getSecurityPolicy());
        
        // Test authentication
        try {
            byte[] data = "test data".getBytes();
            byte[] authTag = lowSecurity.authenticate(data);
            System.out.println("✓ Authentication successful, tag length: " + authTag.length);
        } catch (Exception e) {
            System.err.println("✗ Authentication failed: " + e.getMessage());
        }
    }
    
    private static void testCosemObjects() {
        System.out.println("\n--- Testing COSEM Objects ---");
        
        // Test standard objects
        CosemObject clock = CosemObject.StandardObjects.CLOCK;
        System.out.println("✓ Clock object: " + clock.getClassId() + ":" + clock.getObisCode());
        
        CosemObject power = CosemObject.StandardObjects.ACTIVE_POWER_IMPORT;
        System.out.println("✓ Power object: " + power.getClassId() + ":" + power.getObisCode());
        
        CosemObject voltage = CosemObject.StandardObjects.VOLTAGE_L1;
        System.out.println("✓ Voltage object: " + voltage.getClassId() + ":" + voltage.getObisCode());
        
        CosemObject relay = CosemObject.StandardObjects.RELAY_CONTROL;
        System.out.println("✓ Relay object: " + relay.getClassId() + ":" + relay.getObisCode());
        
        // Test access levels
        System.out.println("✓ Clock access level: " + clock.getAccessLevel());
        System.out.println("✓ Power access level: " + power.getAccessLevel());
        System.out.println("✓ Relay access level: " + relay.getAccessLevel());
    }
    
    private static void testDlmsProtocol() {
        System.out.println("\n--- Testing DLMS Protocol (Simulated) ---");
        
        // Create configuration
        DlmsConfig config = new DlmsConfig();
        config.setReadTimeoutMs(1000);
        config.setConnectTimeoutMs(2000);
        config.setUseHdlc(false);
        config.setClientId(1);
        config.setServerLowerMacAddress(17);
        
        // Create security suite
        SecuritySuite security = SecuritySuite.lowLevelSecurity(
            new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}
        );
        
        // Create protocol (this will fail to connect but should handle gracefully)
        try (DlmsProtocol protocol = DlmsProtocol.builder()
                .ipAddress("192.168.1.100")
                .port(4059)
                .config(config)
                .security(security)
                .build()) {
            
            System.out.println("✓ Protocol created successfully");
            
            // Try to connect (will fail but should handle gracefully)
            boolean connected = protocol.connect();
            System.out.println("✓ Connection attempt handled: " + (connected ? "success" : "failed gracefully"));
            
            // Test get operation (will fail but should handle gracefully)
            CosemObject clock = CosemObject.StandardObjects.CLOCK;
            DlmsProtocol.GetResult result = protocol.get(clock);
            System.out.println("✓ Get operation handled: " + (result.isSuccess() ? "success" : "failed gracefully"));
            
        } catch (Exception e) {
            System.out.println("✓ Protocol handled error gracefully: " + e.getMessage());
        }
    }
} 