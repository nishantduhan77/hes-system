package com.hes.data.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "meter_readings")
@EqualsAndHashCode(callSuper = true)
public class MeterReading extends BaseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "reading_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", nullable = false)
    private Meter meter;

    @Column(name = "capture_time", nullable = false)
    private Instant captureTime;

    @Column(name = "obis_code", nullable = false)
    private String obisCode;

    @Column(name = "value", nullable = false)
    private Double value;

    @Column(name = "unit")
    private String unit;

    @Column(name = "status")
    private String status;

    @Column(name = "quality_code")
    private String qualityCode;

    @Column(name = "source")
    private String source;
} 