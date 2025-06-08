package com.hes.common.entity.oracle;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "METER_READINGS")
@Data
public class OracleMeterReading {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "meter_reading_seq")
    @SequenceGenerator(name = "meter_reading_seq", sequenceName = "METER_READING_SEQ", allocationSize = 1)
    private Long id;

    @Column(name = "METER_ID", nullable = false)
    private String meterId;  // Using String instead of UUID for Oracle compatibility

    @Column(name = "READING_TIMESTAMP", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "READING_TYPE", nullable = false)
    private String readingType;

    @Column(name = "READING_VALUE", nullable = false)
    private Double value;

    @Column(name = "QUALITY_CODE")
    private Integer quality;

    @Column(name = "UNIT")
    private String unit;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 