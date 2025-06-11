package com.hes.common.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@Entity(name = "CommonMeterReading")
@Table(name = "meter_readings")
public class MeterReading {
    @Id
    @Column(name = "meter_id")
    private UUID meterId;

    @Column(name = "hes_timestamp")
    private Instant hesTimestamp;

    @Column(name = "rtc_timestamp")
    private Instant rtcTimestamp;

    @Column(name = "reading_type")
    @Enumerated(EnumType.STRING)
    private ReadingType readingType;

    @Column(name = "value")
    private Double value;

    @Column(name = "quality")
    private Integer quality;

    @Column(name = "unit")
    private String unit;

    @Column(name = "communication_status")
    @Enumerated(EnumType.STRING)
    private CommunicationStatus communicationStatus;

    @Column(name = "original_value")
    private Double originalValue;

    @Column(name = "scaling_factor")
    private Integer scalingFactor;

    @Column(name = "source")
    @Enumerated(EnumType.STRING)
    private ReadingSource source = ReadingSource.NORMAL_READ;

    @Column(name = "capture_period")
    private Integer capturePeriod;

    @Column(name = "validation_status")
    @Enumerated(EnumType.STRING)
    private ValidationStatus validationStatus = ValidationStatus.UNVALIDATED;

    @Column(name = "validation_flags")
    private Integer[] validationFlags;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "meter_program_id")
    private String meterProgramId;

    @Column(name = "channel_id")
    private String channelId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum ReadingType {
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
        POWER_FACTOR,
        FREQUENCY
    }

    public enum ReadingSource {
        NORMAL_READ,
        AUTO_READ,
        MANUAL_READ,
        ESTIMATED,
        CALCULATED
    }

    public enum ValidationStatus {
        UNVALIDATED,
        VALID,
        INVALID,
        ESTIMATED,
        MANUALLY_VALIDATED
    }

    public enum CommunicationStatus {
        SUCCESS,
        TIMEOUT,
        ERROR,
        PARTIAL
    }

    public enum Unit {
        KW("kW"),
        KVAR("kVAr"),
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