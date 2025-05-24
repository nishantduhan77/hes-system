package com.hes.common.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "meter_readings")
@EqualsAndHashCode(of = {"meterId", "timestamp", "readingType"})
public class MeterReading {
    @Id
    @Column(name = "meter_id")
    private UUID meterId;

    @Id
    private Instant timestamp;

    @Id
    @Column(name = "reading_type")
    @Enumerated(EnumType.STRING)
    private ReadingType readingType;

    @Column(nullable = false)
    private Double value;

    @Column(nullable = false)
    private Integer quality = 192; // Default GOOD quality

    @Column(nullable = false)
    private String unit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum ReadingType {
        ACTIVE_ENERGY_IMPORT,
        ACTIVE_ENERGY_EXPORT,
        REACTIVE_ENERGY_IMPORT,
        REACTIVE_ENERGY_EXPORT,
        ACTIVE_POWER_IMPORT,
        ACTIVE_POWER_EXPORT,
        REACTIVE_POWER_IMPORT,
        REACTIVE_POWER_EXPORT,
        VOLTAGE_L1,
        VOLTAGE_L2,
        VOLTAGE_L3,
        CURRENT_L1,
        CURRENT_L2,
        CURRENT_L3,
        FREQUENCY,
        POWER_FACTOR
    }

    public enum Unit {
        KWH("kWh"),
        KVARH("kVARh"),
        KW("kW"),
        KVAR("kVAR"),
        V("V"),
        A("A"),
        HZ("Hz"),
        NONE("");

        private final String symbol;

        Unit(String symbol) {
            this.symbol = symbol;
        }

        public String getSymbol() {
            return symbol;
        }
    }
} 