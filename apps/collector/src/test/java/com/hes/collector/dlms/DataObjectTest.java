package com.hes.collector.dlms;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@DisplayName("Data Object Tests")
class DataObjectTest {

    @Test
    @DisplayName("Should create null data object")
    void shouldCreateNullDataObject() {
        DataObject data = DataObject.newNull();
        assertEquals(DataObject.DataType.NULL, data.getType());
        assertNull(data.getValue());
    }

    @Test
    @DisplayName("Should create boolean data object")
    void shouldCreateBooleanDataObject() {
        DataObject data = DataObject.newBoolean(true);
        assertEquals(DataObject.DataType.BOOLEAN, data.getType());
        assertTrue(data.asBoolean());
        
        DataObject falseData = DataObject.newBoolean(false);
        assertFalse(falseData.asBoolean());
    }

    @Test
    @DisplayName("Should create integer data object")
    void shouldCreateIntegerDataObject() {
        DataObject data = DataObject.newInteger(12345L);
        assertEquals(DataObject.DataType.INTEGER, data.getType());
        assertEquals(12345L, data.asInteger());
    }

    @Test
    @DisplayName("Should create unsigned data object")
    void shouldCreateUnsignedDataObject() {
        DataObject data = DataObject.newUnsigned(12345L);
        assertEquals(DataObject.DataType.UNSIGNED, data.getType());
        assertEquals(12345L, data.asUnsigned());
    }

    @Test
    @DisplayName("Should throw exception for negative unsigned value")
    void shouldThrowExceptionForNegativeUnsignedValue() {
        assertThrows(IllegalArgumentException.class, () -> {
            DataObject.newUnsigned(-1L);
        });
    }

    @Test
    @DisplayName("Should create float data object")
    void shouldCreateFloatDataObject() {
        DataObject data = DataObject.newFloat(123.45f);
        assertEquals(DataObject.DataType.FLOAT, data.getType());
        assertEquals(123.45f, data.asFloat(), 0.001f);
    }

    @Test
    @DisplayName("Should create double data object")
    void shouldCreateDoubleDataObject() {
        DataObject data = DataObject.newDouble(123.45);
        assertEquals(DataObject.DataType.DOUBLE, data.getType());
        assertEquals(123.45, data.asDouble(), 0.001);
    }

    @Test
    @DisplayName("Should create octet string data object")
    void shouldCreateOctetStringDataObject() {
        byte[] bytes = {1, 2, 3, 4, 5};
        DataObject data = DataObject.newOctetString(bytes);
        assertEquals(DataObject.DataType.OCTET_STRING, data.getType());
        assertArrayEquals(bytes, data.asOctetString());
    }

    @Test
    @DisplayName("Should create string data object")
    void shouldCreateStringDataObject() {
        DataObject data = DataObject.newString("test string");
        assertEquals(DataObject.DataType.STRING, data.getType());
        assertEquals("test string", data.asString());
    }

    @Test
    @DisplayName("Should create bit string data object")
    void shouldCreateBitStringDataObject() {
        byte[] bits = {(byte)0x0F, (byte)0xF0};
        DataObject data = DataObject.newBitString(bits);
        assertEquals(DataObject.DataType.BIT_STRING, data.getType());
        assertArrayEquals(bits, data.asBitString());
    }

    @Test
    @DisplayName("Should create datetime data object")
    void shouldCreateDateTimeDataObject() {
        LocalDateTime now = LocalDateTime.now();
        DataObject data = DataObject.newDateTime(now);
        assertEquals(DataObject.DataType.DATETIME, data.getType());
        assertEquals(now, data.asDateTime());
    }

    @Test
    @DisplayName("Should create array data object")
    void shouldCreateArrayDataObject() {
        List<DataObject> elements = Arrays.asList(
            DataObject.newInteger(1L),
            DataObject.newString("test"),
            DataObject.newBoolean(true)
        );
        DataObject data = DataObject.newArray(elements);
        assertEquals(DataObject.DataType.ARRAY, data.getType());
        assertEquals(elements, data.asArray());
    }

    @Test
    @DisplayName("Should create structure data object")
    void shouldCreateStructureDataObject() {
        List<DataObject> fields = Arrays.asList(
            DataObject.newInteger(1L),
            DataObject.newString("field1"),
            DataObject.newBoolean(false)
        );
        DataObject data = DataObject.newStructure(fields);
        assertEquals(DataObject.DataType.STRUCTURE, data.getType());
        assertEquals(fields, data.asStructure());
    }

    @Test
    @DisplayName("Should throw exception for wrong type conversion")
    void shouldThrowExceptionForWrongTypeConversion() {
        DataObject data = DataObject.newInteger(123L);
        
        assertThrows(IllegalStateException.class, () -> {
            data.asString();
        });
        
        assertThrows(IllegalStateException.class, () -> {
            data.asBoolean();
        });
    }

    @Test
    @DisplayName("Should handle octet string immutability")
    void shouldHandleOctetStringImmutability() {
        byte[] original = {1, 2, 3, 4, 5};
        DataObject data = DataObject.newOctetString(original);
        
        byte[] retrieved = data.asOctetString();
        retrieved[0] = 99; // Modify retrieved array
        
        assertArrayEquals(original, data.asOctetString()); // Original should be unchanged
    }

    @Test
    @DisplayName("Should handle bit string immutability")
    void shouldHandleBitStringImmutability() {
        byte[] original = {(byte)0x0F, (byte)0xF0};
        DataObject data = DataObject.newBitString(original);
        
        byte[] retrieved = data.asBitString();
        retrieved[0] = (byte)0xAA; // Modify retrieved array
        
        assertArrayEquals(original, data.asBitString()); // Original should be unchanged
    }

    @Test
    @DisplayName("Should have correct string representation")
    void shouldHaveCorrectStringRepresentation() {
        assertEquals("null", DataObject.newNull().toString());
        assertEquals("true", DataObject.newBoolean(true).toString());
        assertEquals("123", DataObject.newInteger(123L).toString());
        assertEquals("test", DataObject.newString("test").toString());
    }

    @Test
    @DisplayName("Should be equal for same data objects")
    void shouldBeEqualForSameDataObjects() {
        DataObject data1 = DataObject.newInteger(123L);
        DataObject data2 = DataObject.newInteger(123L);
        
        assertEquals(data1, data2);
        assertEquals(data1.hashCode(), data2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal for different data objects")
    void shouldNotBeEqualForDifferentDataObjects() {
        DataObject data1 = DataObject.newInteger(123L);
        DataObject data2 = DataObject.newInteger(456L);
        
        assertNotEquals(data1, data2);
    }
} 