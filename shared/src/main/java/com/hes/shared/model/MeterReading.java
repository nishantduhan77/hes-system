package com.hes.shared.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MeterReading {
    private String meterId;
    private LocalDateTime timestamp;
    private Double activeEnergyImport;
    private Double voltage;
    private Double frequency;
    private String status;
    private String readingType;
} 