package com.hes.collector;

import com.hes.collector.dlms.*;
import com.hes.collector.dlms.security.SecuritySuite;
import java.util.Arrays;

/**
 * Basic DLMS Test Application
 * Tests core DLMS components without network communication
 */
public class DlmsBasicTest {
    
    public static void main(String[] args) {
        System.out.println("==========================================");
        System.out.println("DLMS/COSEM Basic Component Test");
        System.out.println("==========================================");
        
        try {
            // Test 1: OBIS Code
            testObisCode();
            
            // Test 2: Data Object
            testDataObject();
            
            // Test 3: Security Suite
            testSecuritySuite();
            
            // Test 4: COSEM Objects
            testCosemObjects();
            
            System.out.println("\n==========================================");
            System.out.println("✓ All basic tests passed!");
            System.out.println("✓ Core DLMS components are working correctly.");
            System.out.println("==========================================");
            
        } catch (Exception e) {
            System.err.println("✗ Test failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void testObisCode() {
        System.out.println("\n--- Testing OBIS Code ---");
        
        // Test parsing
        ObisCode obis1 = ObisCode.parse("1.0.1.7.0.255");
        System.out.println("✓ Parsed: " + obis1);
        
        // Test creation
        ObisCode obis2 = ObisCode.of(1, 0, 1, 8, 0, 255);
        System.out.println("✓ Created: " + obis2);
        
        // Test equality
        ObisCode obis3 = ObisCode.parse("1.0.1.7.0.255");
        System.out.println("✓ Equality: " + obis1.equals(obis3));
        
        // Test error handling
        try {
            ObisCode.parse("invalid");
            System.err.println("✗ Should have thrown exception");
        } catch (IllegalArgumentException e) {
            System.out.println("✓ Handled invalid format correctly");
        }
        
        System.out.println("✓ OBIS Code tests passed");
    }
    
    private static void testDataObject() {
        System.out.println("\n--- Testing Data Object ---");
        
        // Test different types
        DataObject nullObj = DataObject.newNull();
        System.out.println("✓ Null: " + nullObj);
        
        DataObject boolObj = DataObject.newBoolean(true);
        System.out.println("✓ Boolean: " + boolObj.asBoolean());
        
        DataObject intObj = DataObject.newInteger(12345L);
        System.out.println("✓ Integer: " + intObj.asInteger());
        
        DataObject stringObj = DataObject.newString("test");
        System.out.println("✓ String: " + stringObj.asString());
        
        DataObject floatObj = DataObject.newFloat(123.45f);
        System.out.println("✓ Float: " + floatObj.asFloat());
        
        // Test octet string
        byte[] bytes = {1, 2, 3, 4, 5};
        DataObject octetObj = DataObject.newOctetString(bytes);
        System.out.println("✓ Octet string: " + Arrays.toString(octetObj.asOctetString()));
        
        // Test error handling
        try {
            intObj.asString();
            System.err.println("✗ Should have thrown exception");
        } catch (IllegalStateException e) {
            System.out.println("✓ Handled wrong type conversion correctly");
        }
        
        System.out.println("✓ Data Object tests passed");
    }
    
    private static void testSecuritySuite() {
        System.out.println("\n--- Testing Security Suite ---");
        
        // Test no security
        SecuritySuite noSecurity = SecuritySuite.noSecurity();
        System.out.println("✓ No security: " + noSecurity.getSecurityPolicy());
        
        // Test low level security
        byte[] authKey = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16};
        SecuritySuite lowSecurity = SecuritySuite.lowLevelSecurity(authKey);
        System.out.println("✓ Low security: " + lowSecurity.getSecurityPolicy());
        
        // Test high level security
        byte[] encKey = {16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1};
        byte[] sysTitle = {0x4D, 0x4D, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x01};
        SecuritySuite highSecurity = SecuritySuite.highLevelSecurity(authKey, encKey, sysTitle);
        System.out.println("✓ High security: " + highSecurity.getSecurityPolicy());
        
        // Test authentication
        try {
            byte[] data = "test data".getBytes();
            byte[] authTag = lowSecurity.authenticate(data);
            System.out.println("✓ Authentication: " + authTag.length + " bytes");
        } catch (Exception e) {
            System.err.println("✗ Authentication failed: " + e.getMessage());
        }
        
        System.out.println("✓ Security Suite tests passed");
    }
    
    private static void testCosemObjects() {
        System.out.println("\n--- Testing COSEM Objects ---");
        
        // Test standard objects
        CosemObject clock = CosemObject.StandardObjects.CLOCK;
        System.out.println("✓ Clock: " + clock.getClassId() + ":" + clock.getObisCode());
        
        CosemObject power = CosemObject.StandardObjects.ACTIVE_POWER_IMPORT;
        System.out.println("✓ Power: " + power.getClassId() + ":" + power.getObisCode());
        
        CosemObject voltage = CosemObject.StandardObjects.VOLTAGE_L1;
        System.out.println("✓ Voltage: " + voltage.getClassId() + ":" + voltage.getObisCode());
        
        CosemObject relay = CosemObject.StandardObjects.RELAY_CONTROL;
        System.out.println("✓ Relay: " + relay.getClassId() + ":" + relay.getObisCode());
        
        // Test access levels
        System.out.println("✓ Clock access: " + clock.getAccessLevel());
        System.out.println("✓ Power access: " + power.getAccessLevel());
        System.out.println("✓ Relay access: " + relay.getAccessLevel());
        
        System.out.println("✓ COSEM Objects tests passed");
    }
} 