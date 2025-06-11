package com.hes.data.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity(name = "DataMeterReading")
@Table(name = "meter_readings")
@EqualsAndHashCode(callSuper = true)
public class MeterReading extends BaseEntity {
    @Id
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id")
    private Meter meter;

    @Column(name = "reading_timestamp")
    private Instant timestamp;

    @Column(name = "reading_value")
    private Double value;

    @Column(name = "reading_type")
    private String readingType;

    @Column(name = "quality_code")
    private Integer quality;

    @Column(name = "unit")
    private String unit;

    @Column(name = "communication_status")
    private String communicationStatus;

    @Column(name = "validation_status")
    private String validationStatus;

    @Column(name = "validation_flags")
    private Integer[] validationFlags;
} 