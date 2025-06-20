package com.hes.collector.dlms;

public class CosemObject {
    private final int classId;
    private final ObisCode obisCode;
    private final int attributeId;
    private final int dataIndex;
    private final AccessLevel accessLevel;

    public CosemObject(int classId, ObisCode obisCode, int attributeId, int dataIndex, AccessLevel accessLevel) {
        this.classId = classId;
        this.obisCode = obisCode;
        this.attributeId = attributeId;
        this.dataIndex = dataIndex;
        this.accessLevel = accessLevel;
    }

    // Getters
    public int getClassId() { return classId; }
    public ObisCode getObisCode() { return obisCode; }
    public int getAttributeId() { return attributeId; }
    public int getDataIndex() { return dataIndex; }
    public AccessLevel getAccessLevel() { return accessLevel; }

    // Static builder method
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int classId;
        private ObisCode obisCode;
        private int attributeId;
        private int dataIndex;
        private AccessLevel accessLevel;

        public Builder classId(int classId) { this.classId = classId; return this; }
        public Builder obisCode(ObisCode obisCode) { this.obisCode = obisCode; return this; }
        public Builder attributeId(int attributeId) { this.attributeId = attributeId; return this; }
        public Builder dataIndex(int dataIndex) { this.dataIndex = dataIndex; return this; }
        public Builder accessLevel(AccessLevel accessLevel) { this.accessLevel = accessLevel; return this; }

        public CosemObject build() {
            return new CosemObject(classId, obisCode, attributeId, dataIndex, accessLevel);
        }
    }

    public enum AccessLevel {
        NO_ACCESS(0),
        READ_ONLY(1),
        WRITE_ONLY(2),
        READ_WRITE(3),
        AUTHENTICATED_READ_ONLY(4),
        AUTHENTICATED_WRITE_ONLY(5),
        AUTHENTICATED_READ_WRITE(6);

        private final int value;

        AccessLevel(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }
    }

    public static class StandardObjects {
        // Clock object (class_id = 8)
        public static final CosemObject CLOCK = CosemObject.builder()
            .classId(8)
            .obisCode(ObisCode.parse("0.0.1.0.0.255"))
            .attributeId(2)
            .dataIndex(0)
            .accessLevel(AccessLevel.READ_WRITE)
            .build();

        // Association object (class_id = 15)
        public static final CosemObject ASSOCIATION_LN = CosemObject.builder()
            .classId(15)
            .obisCode(ObisCode.parse("0.0.40.0.0.255"))
            .attributeId(2)
            .dataIndex(0)
            .accessLevel(AccessLevel.READ_ONLY)
            .build();

        // Active power object (class_id = 3)
        public static final CosemObject ACTIVE_POWER_IMPORT = CosemObject.builder()
            .classId(3)
            .obisCode(ObisCode.parse("1.0.1.7.0.255"))
            .attributeId(2)
            .dataIndex(0)
            .accessLevel(AccessLevel.READ_ONLY)
            .build();

        // Voltage object (class_id = 3)
        public static final CosemObject VOLTAGE_L1 = CosemObject.builder()
            .classId(3)
            .obisCode(ObisCode.parse("1.0.32.7.0.255"))
            .attributeId(2)
            .dataIndex(0)
            .accessLevel(AccessLevel.READ_ONLY)
            .build();

        // Current object (class_id = 3)
        public static final CosemObject CURRENT_L1 = CosemObject.builder()
            .classId(3)
            .obisCode(ObisCode.parse("1.0.31.7.0.255"))
            .attributeId(2)
            .dataIndex(0)
            .accessLevel(AccessLevel.READ_ONLY)
            .build();

        // Relay control object (class_id = 70)
        public static final CosemObject RELAY_CONTROL = CosemObject.builder()
            .classId(70)
            .obisCode(ObisCode.parse("0.0.96.3.10.255"))
            .attributeId(3)
            .dataIndex(0)
            .accessLevel(AccessLevel.READ_WRITE)
            .build();

        // Static method to get object by name (similar to enum.valueOf)
        public static CosemObject valueOf(String name) {
            switch (name.toUpperCase()) {
                case "CLOCK": return CLOCK;
                case "ASSOCIATION_LN": return ASSOCIATION_LN;
                case "ACTIVE_POWER_IMPORT": return ACTIVE_POWER_IMPORT;
                case "VOLTAGE_L1": return VOLTAGE_L1;
                case "CURRENT_L1": return CURRENT_L1;
                case "RELAY_CONTROL": return RELAY_CONTROL;
                default: throw new IllegalArgumentException("Unknown COSEM object: " + name);
            }
        }
    }
} 