package com.hes.collector.dlms;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("OBIS Code Tests")
class ObisCodeTest {

    @Test
    @DisplayName("Should parse valid OBIS code string")
    void shouldParseValidObisCodeString() {
        String obisString = "1.0.1.7.0.255";
        ObisCode obisCode = ObisCode.parse(obisString);
        
        assertEquals("1.0.1.7.0.255", obisCode.toString());
        assertArrayEquals(new byte[]{1, 0, 1, 7, 0, (byte)255}, obisCode.getCode());
    }

    @Test
    @DisplayName("Should create OBIS code from integers")
    void shouldCreateObisCodeFromIntegers() {
        ObisCode obisCode = ObisCode.of(1, 0, 1, 7, 0, 255);
        
        assertEquals("1.0.1.7.0.255", obisCode.toString());
        assertArrayEquals(new byte[]{1, 0, 1, 7, 0, (byte)255}, obisCode.getCode());
    }

    @Test
    @DisplayName("Should throw exception for invalid OBIS format")
    void shouldThrowExceptionForInvalidFormat() {
        assertThrows(IllegalArgumentException.class, () -> {
            ObisCode.parse("invalid");
        });
        
        assertThrows(IllegalArgumentException.class, () -> {
            ObisCode.parse("1.2.3.4.5");
        });
        
        assertThrows(IllegalArgumentException.class, () -> {
            ObisCode.parse("1.2.3.4.5.6.7");
        });
    }

    @Test
    @DisplayName("Should throw exception for values out of range")
    void shouldThrowExceptionForValuesOutOfRange() {
        assertThrows(IllegalArgumentException.class, () -> {
            ObisCode.of(1, 2, 3, 4, 5, 256);
        });
        
        assertThrows(IllegalArgumentException.class, () -> {
            ObisCode.of(-1, 2, 3, 4, 5, 6);
        });
    }

    @Test
    @DisplayName("Should handle zero values")
    void shouldHandleZeroValues() {
        ObisCode obisCode = ObisCode.of(0, 0, 0, 0, 0, 0);
        assertEquals("0.0.0.0.0.0", obisCode.toString());
    }

    @Test
    @DisplayName("Should handle maximum values")
    void shouldHandleMaximumValues() {
        ObisCode obisCode = ObisCode.of(255, 255, 255, 255, 255, 255);
        assertEquals("255.255.255.255.255.255", obisCode.toString());
    }

    @Test
    @DisplayName("Should be equal for same OBIS codes")
    void shouldBeEqualForSameObisCodes() {
        ObisCode code1 = ObisCode.parse("1.0.1.7.0.255");
        ObisCode code2 = ObisCode.parse("1.0.1.7.0.255");
        ObisCode code3 = ObisCode.of(1, 0, 1, 7, 0, 255);
        
        assertEquals(code1, code2);
        assertEquals(code1, code3);
        assertEquals(code1.hashCode(), code2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal for different OBIS codes")
    void shouldNotBeEqualForDifferentObisCodes() {
        ObisCode code1 = ObisCode.parse("1.0.1.7.0.255");
        ObisCode code2 = ObisCode.parse("1.0.1.8.0.255");
        
        assertNotEquals(code1, code2);
        assertNotEquals(code1.hashCode(), code2.hashCode());
    }

    @Test
    @DisplayName("Should handle null input")
    void shouldHandleNullInput() {
        assertThrows(IllegalArgumentException.class, () -> {
            ObisCode.parse(null);
        });
    }
} 