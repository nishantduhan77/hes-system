package com.hes.data.enums;

public enum MeterEvent {
    // Voltage related events
    R_PHASE_VOLTAGE_MISSING_OCCURRENCE(1, "0.0.99.98.0.255", "R-Phase – Voltage Missing – Occurrence"),
    R_PHASE_VOLTAGE_MISSING_RESTORATION(2, "0.0.99.98.0.255", "R-Phase – Voltage Missing – Restoration"),
    Y_PHASE_VOLTAGE_MISSING_OCCURRENCE(3, "0.0.99.98.0.255", "Y-Phase – Voltage Missing – Occurrence"),
    Y_PHASE_VOLTAGE_MISSING_RESTORATION(4, "0.0.99.98.0.255", "Y-Phase – Voltage Missing – Restoration"),
    B_PHASE_VOLTAGE_MISSING_OCCURRENCE(5, "0.0.99.98.0.255", "B-Phase – Voltage Missing – Occurrence"),
    B_PHASE_VOLTAGE_MISSING_RESTORATION(6, "0.0.99.98.0.255", "B-Phase – Voltage Missing – Restoration"),
    OVER_VOLTAGE_OCCURRENCE(7, "0.0.99.98.0.255", "Over Voltage in any phase – Occurrence"),
    OVER_VOLTAGE_RESTORATION(8, "0.0.99.98.0.255", "Over Voltage in any Phase – Restoration"),
    LOW_VOLTAGE_OCCURRENCE(9, "0.0.99.98.0.255", "Low Voltage in any phase – Occurrence"),
    LOW_VOLTAGE_RESTORATION(10, "0.0.99.98.0.255", "Low Voltage in any phase – Restoration"),
    VOLTAGE_UNBALANCE_OCCURRENCE(11, "0.0.99.98.0.255", "Voltage Unbalance – Occurrence"),
    VOLTAGE_UNBALANCE_RESTORATION(12, "0.0.99.98.0.255", "Voltage Unbalance – Restoration"),
    PHASE_SEQUENCE_REVERSE_OCCURRENCE(21, "0.0.99.98.0.255", "Phase Sequence Reverse – Occurrence"),
    PHASE_SEQUENCE_REVERSE_RESTORATION(22, "0.0.99.98.0.255", "Phase Sequence Reverse – Restoration"),
    // Current related events
    R_PHASE_CURRENT_REVERSE_OCCURRENCE(51, "0.0.99.98.1.255", "R Phase – Current reverse – Occurrence"),
    R_PHASE_CURRENT_REVERSE_RESTORATION(52, "0.0.99.98.1.255", "R Phase – Current reverse – Restoration"),
    Y_PHASE_CURRENT_REVERSE_OCCURRENCE(53, "0.0.99.98.1.255", "Y Phase – Current reverse – Occurrence"),
    Y_PHASE_CURRENT_REVERSE_RESTORATION(54, "0.0.99.98.1.255", "Y Phase – Current reverse – Restoration"),
    B_PHASE_CURRENT_REVERSE_OCCURRENCE(55, "0.0.99.98.1.255", "B Phase – Current reverse – Occurrence"),
    B_PHASE_CURRENT_REVERSE_RESTORATION(56, "0.0.99.98.1.255", "B Phase – Current reverse – Restoration"),
    R_PHASE_CT_OPEN_OCCURRENCE(57, "0.0.99.98.1.255", "R Phase – CT open – Occurrence"),
    R_PHASE_CT_OPEN_RESTORATION(58, "0.0.99.98.1.255", "R Phase – CT open – Restoration"),
    Y_PHASE_CT_OPEN_OCCURRENCE(59, "0.0.99.98.1.255", "Y Phase – CT Open – Occurrence"),
    Y_PHASE_CT_OPEN_RESTORATION(60, "0.0.99.98.1.255", "Y Phase – CT Open – Restoration"),
    B_PHASE_CT_OPEN_OCCURRENCE(61, "0.0.99.98.1.255", "B Phase – CT Open – Occurrence"),
    B_PHASE_CT_OPEN_RESTORATION(62, "0.0.99.98.1.255", "B Phase – CT Open – Restoration"),
    CURRENT_UNBALANCE_OCCURRENCE(63, "0.0.99.98.1.255", "Current Unbalance – Occurrence"),
    CURRENT_UNBALANCE_RESTORATION(64, "0.0.99.98.1.255", "Current Unbalance – Restoration"),
    CURRENT_BYPASS_OCCURRENCE(65, "0.0.99.98.1.255", "Current bypass – Occurrence"),
    CURRENT_BYPASS_RESTORATION(66, "0.0.99.98.1.255", "Current bypass – Restoration"),
    OVER_CURRENT_ANY_PHASE_OCCURRENCE(67, "0.0.99.98.1.255", "Over current in any phase – Occurrence"),
    OVER_CURRENT_ANY_PHASE_RESTORATION(68, "0.0.99.98.1.255", "Over current in any phase – Restoration"),
    HIGH_NEUTRAL_CURRENT_OCCURRENCE(83, "0.0.99.98.1.255", "High Neutral Current – Occurrence"),
    HIGH_NEUTRAL_CURRENT_RESTORATION(84, "0.0.99.98.1.255", "High Neutral Current – Restoration"),
    // Power related events
    POWER_FAILURE_OCCURRENCE(101, "0.0.99.98.2.255", "Power failure – Occurrence"),
    POWER_FAILURE_RESTORATION(102, "0.0.99.98.2.255", "Power failure – Restoration"),
    // Transaction events (sample)
    PT_RATIO_CONFIGURATION(125, "0.0.99.98.3.255", "PT Ratio configuration (in case of HT CT/PT meters only)"),
    CT_RATIO_CONFIGURATION(126, "0.0.99.98.3.255", "CT Ratio configuration (in case of both LTCT and HT CT/PT meters)"),
    // ... add more as needed
    ;
    private final int eventId;
    private final String obisCode;
    private final String eventName;
    MeterEvent(int eventId, String obisCode, String eventName) {
        this.eventId = eventId;
        this.obisCode = obisCode;
        this.eventName = eventName;
    }
    public int getEventId() { return eventId; }
    public String getObisCode() { return obisCode; }
    public String getEventName() { return eventName; }
} 