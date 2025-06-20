package com.hes.collector.enums;

import lombok.Getter;

@Getter
public enum EswfBit {
    COMMUNICATION_ERROR(0, "Communication Error"),
    AUTHENTICATION_ERROR(1, "Authentication Error"),
    RELAY_ERROR(2, "Relay Error"),
    FIRMWARE_ERROR(3, "Firmware Error"),
    CONFIGURATION_ERROR(4, "Configuration Error"),
    CLOCK_ERROR(5, "Clock Error"),
    MEMORY_ERROR(6, "Memory Error"),
    BATTERY_LOW(7, "Battery Low"),
    POWER_FAILURE(8, "Power Failure"),
    TAMPER_DETECTED(9, "Tamper Detected"),
    MAGNETIC_TAMPER(10, "Magnetic Tamper"),
    COVER_OPEN(11, "Cover Open"),
    LOAD_LIMIT_EXCEEDED(12, "Load Limit Exceeded"),
    VOLTAGE_UNBALANCE(13, "Voltage Unbalance"),
    CURRENT_UNBALANCE(14, "Current Unbalance"),
    NEUTRAL_DISTURBANCE(15, "Neutral Disturbance");

    private final int bitNumber;
    private final String description;

    EswfBit(int bitNumber, String description) {
        this.bitNumber = bitNumber;
        this.description = description;
    }

    public int getBitNumber() {
        return bitNumber;
    }

    public String getDescription() {
        return description;
    }
} 