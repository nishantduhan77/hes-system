package com.hes.collector.dlms;

import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Getter
public class DataObject {
    private final DataType type;
    private final Object value;

    public enum DataType {
        NULL,
        BOOLEAN,
        INTEGER,
        UNSIGNED,
        FLOAT,
        DOUBLE,
        OCTET_STRING,
        STRING,
        BIT_STRING,
        DATETIME,
        DATE,
        TIME,
        ARRAY,
        STRUCTURE,
        COMPACT_ARRAY
    }

    private DataObject(DataType type, Object value) {
        this.type = type;
        this.value = value;
    }

    // Factory methods for different data types
    public static DataObject newNull() {
        return new DataObject(DataType.NULL, null);
    }

    public static DataObject newBoolean(boolean value) {
        return new DataObject(DataType.BOOLEAN, value);
    }

    public static DataObject newInteger(long value) {
        return new DataObject(DataType.INTEGER, value);
    }

    public static DataObject newLong(Long value) {
        return new DataObject(DataType.INTEGER, value);
    }

    public static DataObject newUnsigned(long value) {
        if (value < 0) {
            throw new IllegalArgumentException("Unsigned value cannot be negative");
        }
        return new DataObject(DataType.UNSIGNED, value);
    }

    public static DataObject newFloat(float value) {
        return new DataObject(DataType.FLOAT, value);
    }

    public static DataObject newDouble(double value) {
        return new DataObject(DataType.DOUBLE, value);
    }

    public static DataObject newOctetString(byte[] value) {
        return new DataObject(DataType.OCTET_STRING, Arrays.copyOf(value, value.length));
    }

    public static DataObject newOctetString(String value) {
        return new DataObject(DataType.OCTET_STRING, value.getBytes());
    }

    public static DataObject newString(String value) {
        return new DataObject(DataType.STRING, value);
    }

    public static DataObject newBitString(byte[] value) {
        return new DataObject(DataType.BIT_STRING, Arrays.copyOf(value, value.length));
    }

    public static DataObject newDateTime(LocalDateTime value) {
        return new DataObject(DataType.DATETIME, value);
    }

    public static DataObject newArray(List<DataObject> value) {
        return new DataObject(DataType.ARRAY, value);
    }

    public static DataObject newStructure(List<DataObject> value) {
        return new DataObject(DataType.STRUCTURE, value);
    }

    public boolean isBoolean() {
        return this.type == DataType.BOOLEAN;
    }

    // Type-safe getters
    public Boolean asBoolean() {
        checkType(DataType.BOOLEAN);
        return (Boolean) value;
    }

    public Long asInteger() {
        checkType(DataType.INTEGER);
        return (Long) value;
    }

    public Long asUnsigned() {
        checkType(DataType.UNSIGNED);
        return (Long) value;
    }

    public Float asFloat() {
        checkType(DataType.FLOAT);
        return (Float) value;
    }

    public Double asDouble() {
        checkType(DataType.DOUBLE);
        return (Double) value;
    }

    public byte[] asOctetString() {
        checkType(DataType.OCTET_STRING);
        return Arrays.copyOf((byte[]) value, ((byte[]) value).length);
    }

    public String asString() {
        checkType(DataType.STRING);
        return (String) value;
    }

    public byte[] asBitString() {
        checkType(DataType.BIT_STRING);
        return Arrays.copyOf((byte[]) value, ((byte[]) value).length);
    }

    public LocalDateTime asDateTime() {
        checkType(DataType.DATETIME);
        return (LocalDateTime) value;
    }

    @SuppressWarnings("unchecked")
    public List<DataObject> asArray() {
        checkType(DataType.ARRAY);
        return (List<DataObject>) value;
    }

    @SuppressWarnings("unchecked")
    public List<DataObject> asStructure() {
        checkType(DataType.STRUCTURE);
        return (List<DataObject>) value;
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
        switch (type) {
            case OCTET_STRING:
            case BIT_STRING:
                return Arrays.toString((byte[]) value);
            case ARRAY:
            case STRUCTURE:
                return value.toString();
            default:
                return value.toString();
        }
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        DataObject other = (DataObject) obj;
        if (type != other.type) return false;
        if (value == null) return other.value == null;
        return value.equals(other.value);
    }

    @Override
    public int hashCode() {
        int result = type.hashCode();
        result = 31 * result + (value != null ? value.hashCode() : 0);
        return result;
    }
} 