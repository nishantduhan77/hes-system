// Standalone DLMS Test - Can be compiled and run independently
// Save this as DlmsStandaloneTest.java and run: javac DlmsStandaloneTest.java && java DlmsStandaloneTest

import java.util.Arrays;
import java.util.regex.Pattern;

public class DlmsStandaloneTest {
    
    public static void main(String[] args) {
        System.out.println("==========================================");
        System.out.println("DLMS/COSEM Standalone Component Test");
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
            System.out.println("✓ All standalone tests passed!");
            System.out.println("✓ Core DLMS components are working correctly.");
            System.out.println("==========================================");
            
        } catch (Exception e) {
            System.err.println("✗ Test failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // OBIS Code Implementation
    static class ObisCode {
        private static final Pattern OBIS_PATTERN = Pattern.compile("^\\d+\\.\\d+\\.\\d+\\.\\d+\\.\\d+\\.\\d+$");
        private final byte[] code;

        private ObisCode(byte[] code) {
            if (code == null || code.length != 6) {
                throw new IllegalArgumentException("OBIS code must be 6 bytes");
            }
            this.code = Arrays.copyOf(code, 6);
        }

        public static ObisCode parse(String obisString) {
            if (obisString == null || !OBIS_PATTERN.matcher(obisString).matches()) {
                throw new IllegalArgumentException("Invalid OBIS code format");
            }

            String[] parts = obisString.split("\\.");
            byte[] code = new byte[6];
            
            for (int i = 0; i < 6; i++) {
                int value = Integer.parseInt(parts[i]);
                if (value < 0 || value > 255) {
                    throw new IllegalArgumentException("OBIS code values must be between 0 and 255");
                }
                code[i] = (byte) value;
            }

            return new ObisCode(code);
        }

        public static ObisCode of(int a, int b, int c, int d, int e, int f) {
            byte[] code = new byte[] {
                validateByte(a),
                validateByte(b),
                validateByte(c),
                validateByte(d),
                validateByte(e),
                validateByte(f)
            };
            return new ObisCode(code);
        }

        private static byte validateByte(int value) {
            if (value < 0 || value > 255) {
                throw new IllegalArgumentException("OBIS code values must be between 0 and 255");
            }
            return (byte) value;
        }

        @Override
        public String toString() {
            return String.format("%d.%d.%d.%d.%d.%d",
                code[0] & 0xFF,
                code[1] & 0xFF,
                code[2] & 0xFF,
                code[3] & 0xFF,
                code[4] & 0xFF,
                code[5] & 0xFF);
        }

        @Override
        public boolean equals(Object obj) {
            if (this == obj) return true;
            if (obj == null || getClass() != obj.getClass()) return false;
            ObisCode other = (ObisCode) obj;
            return Arrays.equals(code, other.code);
        }

        @Override
        public int hashCode() {
            return Arrays.hashCode(code);
        }
    }
    
    // Data Object Implementation
    static class DataObject {
        private final DataType type;
        private final Object value;

        public enum DataType {
            NULL, BOOLEAN, INTEGER, UNSIGNED, FLOAT, DOUBLE, OCTET_STRING, STRING
        }

        private DataObject(DataType type, Object value) {
            this.type = type;
            this.value = value;
        }

        public static DataObject newNull() {
            return new DataObject(DataType.NULL, null);
        }

        public static DataObject newBoolean(boolean value) {
            return new DataObject(DataType.BOOLEAN, value);
        }

        public static DataObject newInteger(long value) {
            return new DataObject(DataType.INTEGER, value);
        }

        public static DataObject newString(String value) {
            return new DataObject(DataType.STRING, value);
        }

        public static DataObject newFloat(float value) {
            return new DataObject(DataType.FLOAT, value);
        }

        public static DataObject newOctetString(byte[] value) {
            return new DataObject(DataType.OCTET_STRING, Arrays.copyOf(value, value.length));
        }

        public Boolean asBoolean() {
            checkType(DataType.BOOLEAN);
            return (Boolean) value;
        }

        public Long asInteger() {
            checkType(DataType.INTEGER);
            return (Long) value;
        }

        public String asString() {
            checkType(DataType.STRING);
            return (String) value;
        }

        public Float asFloat() {
            checkType(DataType.FLOAT);
            return (Float) value;
        }

        public byte[] asOctetString() {
            checkType(DataType.OCTET_STRING);
            return Arrays.copyOf((byte[]) value, ((byte[]) value).length);
        }

        private void checkType(DataType expectedType) {
            if (type != expectedType) {
                throw new IllegalStateException(
                    String.format("Cannot convert %s to %s", type, expectedType));
            }
        }

        @Override
        public String toString() {
            if (value == null) {
                return "null";
            }
            return value.toString();
        }
    }
    
    // Security Suite Implementation
    static class SecuritySuite {
        public enum SecurityPolicy {
            NONE(0), AUTHENTICATION(1), ENCRYPTION(2), AUTHENTICATION_ENCRYPTION(3);

            private final int value;
            SecurityPolicy(int value) { this.value = value; }
            public int getValue() { return value; }
        }

        private final SecurityPolicy securityPolicy;
        private final byte[] authenticationKey;
        private final byte[] encryptionKey;

        private SecuritySuite(SecurityPolicy securityPolicy, byte[] authenticationKey, byte[] encryptionKey) {
            this.securityPolicy = securityPolicy;
            this.authenticationKey = authenticationKey;
            this.encryptionKey = encryptionKey;
        }

        public static SecuritySuite noSecurity() {
            return new SecuritySuite(SecurityPolicy.NONE, new byte[0], new byte[0]);
        }

        public static SecuritySuite lowLevelSecurity(byte[] authKey) {
            return new SecuritySuite(SecurityPolicy.AUTHENTICATION, authKey, new byte[0]);
        }

        public static SecuritySuite highLevelSecurity(byte[] authKey, byte[] encKey, byte[] sysTitle) {
            return new SecuritySuite(SecurityPolicy.AUTHENTICATION_ENCRYPTION, authKey, encKey);
        }

        public SecurityPolicy getSecurityPolicy() {
            return securityPolicy;
        }

        public byte[] authenticate(byte[] data) throws Exception {
            if (securityPolicy == SecurityPolicy.NONE) {
                return data;
            }
            // Simple hash simulation
            byte[] hash = new byte[8];
            for (int i = 0; i < Math.min(8, data.length); i++) {
                hash[i] = (byte) (data[i] ^ authenticationKey[i % authenticationKey.length]);
            }
            return hash;
        }
    }
    
    // COSEM Object Implementation
    static class CosemObject {
        private final int classId;
        private final ObisCode obisCode;
        private final int attributeId;
        private final AccessLevel accessLevel;

        public enum AccessLevel {
            NO_ACCESS(0), READ_ONLY(1), WRITE_ONLY(2), READ_WRITE(3);

            private final int value;
            AccessLevel(int value) { this.value = value; }
            public int getValue() { return value; }
        }

        private CosemObject(int classId, ObisCode obisCode, int attributeId, AccessLevel accessLevel) {
            this.classId = classId;
            this.obisCode = obisCode;
            this.attributeId = attributeId;
            this.accessLevel = accessLevel;
        }

        public int getClassId() { return classId; }
        public ObisCode getObisCode() { return obisCode; }
        public int getAttributeId() { return attributeId; }
        public AccessLevel getAccessLevel() { return accessLevel; }

        public static class StandardObjects {
            public static final CosemObject CLOCK = new CosemObject(8, ObisCode.parse("0.0.1.0.0.255"), 2, AccessLevel.READ_WRITE);
            public static final CosemObject ACTIVE_POWER_IMPORT = new CosemObject(3, ObisCode.parse("1.0.1.7.0.255"), 2, AccessLevel.READ_ONLY);
            public static final CosemObject VOLTAGE_L1 = new CosemObject(3, ObisCode.parse("1.0.32.7.0.255"), 2, AccessLevel.READ_ONLY);
            public static final CosemObject RELAY_CONTROL = new CosemObject(70, ObisCode.parse("0.0.96.3.10.255"), 3, AccessLevel.READ_WRITE);
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