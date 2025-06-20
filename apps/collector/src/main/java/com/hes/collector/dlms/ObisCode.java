package com.hes.collector.dlms;

import lombok.Getter;
import java.util.Arrays;
import java.util.regex.Pattern;

@Getter
public class ObisCode {
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