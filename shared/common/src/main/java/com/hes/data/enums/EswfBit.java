package com.hes.data.enums;

public enum EswfBit {
    R_PHASE_VOLTAGE_MISSING(0, "R Phase Voltage Missing"),
    Y_PHASE_VOLTAGE_MISSING(1, "Y Phase Voltage Missing"),
    B_PHASE_VOLTAGE_MISSING(2, "B Phase Voltage Missing"),
    OVER_VOLTAGE(3, "Over Voltage"),
    LOW_VOLTAGE(4, "Low Voltage"),
    VOLTAGE_UNBALANCE(5, "Voltage Unbalance"),
    R_PHASE_CURRENT_REVERSE(6, "R Phase Current Reverse"),
    Y_PHASE_CURRENT_REVERSE(7, "Y Phase Current Reverse"),
    B_PHASE_CURRENT_REVERSE(8, "B Phase Current Reverse"),
    CURRENT_UNBALANCE(9, "Current Unbalance"),
    CURRENT_BYPASS_SHORT(10, "Current Bypass/Short"),
    VERY_LOW_PF(11, "Very Low Pf"),
    // 12-15 Reserved
    // 16-31 Reserved
    // 32-63 Reserved
    INFLUENCE_OF_PERMANENT_MAGNET(80, "Influence of permanent magnet or ac/dc electromagnet"),
    NEUTRAL_DISTURBANCE(81, "Neutral disturbance - HF,dc or alternate method"),
    METER_COVER_OPEN(82, "Meter cover open"),
    LAST_GASP_OCCURRENCE(85, "Last Gasp - Occurrence"),
    FIRST_BREATH_RESTORATION(86, "First Breath - Restoration"),
    INCREMENT_BILLING_COUNTER(87, "Increment in Billing counter (Manual/MRI reset)"),
    RTC_BAD(89, "RTC bad"),
    NVM_BAD(90, "NVM bad"),
    WRONG_PHASE_ASSOCIATION(115, "Wrong Phase Association"),
    TEMPERATURE_RISE(116, "Temperature Rise"),
    ESD_OCCURRENCE(119, "ESD - Occurrence"),
    PHASE_SEQUENCE_REVERSE(120, "Phase sequence Reverse"),
    R_PHASE_CT_OPEN(122, "R PH CT Open"),
    Y_PHASE_CT_OPEN(123, "Y PH CT Open"),
    B_PHASE_CT_OPEN(124, "B PH CT Open"),
    HIGH_NEUTRAL_CURRENT(125, "High Neutral Current");
    // 126-127 Reserved

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