package com.hes.collector.model;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeterReading {
    // Basic identification
    private String id;
    private String meterSerialNumber;
    private String transactionId;
    
    // Timestamps
    private Instant timestamp;
    private Instant captureTime;
    private Instant readingTime;
    private Instant collectionTime;
    private String rtcTime;
    
    // Energy readings
    private BigDecimal activeEnergyImport;
    private BigDecimal activeEnergyExport;
    private BigDecimal reactiveEnergyImport;
    private BigDecimal reactiveEnergyExport;
    private BigDecimal apparentEnergy;
    private double cumEnergyWhImport;
    private double cumEnergyWhExport;
    
    // Power readings
    private BigDecimal activePowerImport;
    private BigDecimal activePowerExport;
    private BigDecimal reactivePowerImport;
    private BigDecimal reactivePowerExport;
    private BigDecimal apparentPower;
    private double activePower;
    private double reactivePower;
    private double apparentPowerDouble;
    
    // Voltage and current
    private BigDecimal voltageL1;
    private BigDecimal voltageL2;
    private BigDecimal voltageL3;
    private BigDecimal currentL1;
    private BigDecimal currentL2;
    private BigDecimal currentL3;
    private double l1CurrentIr;
    private double l2CurrentIy;
    private double l3CurrentIb;
    private double l1VoltageVrn;
    private double l2VoltageVyn;
    private double l3VoltageVbn;
    
    // Power factor and frequency
    private BigDecimal powerFactor;
    private BigDecimal frequency;
    private double l1PowerFactor;
    private double l2PowerFactor;
    private double l3PowerFactor;
    private double threePhasePf;
    private double frequencyDouble;
    
    // Demand values
    private BigDecimal maximumDemand;
    private BigDecimal currentDemand;
    private BigDecimal averageDemand;
    
    // Status and quality
    private String readingQuality;
    private String readingStatus;
    private boolean isValid;
    private String validationMessage;
    
    // Additional metadata
    private String readingType;
    private String source;
    private String notes;
    
    // Default values for compatibility
    public static MeterReading createDefaultReading(String meterSerialNumber) {
        return MeterReading.builder()
            .meterSerialNumber(meterSerialNumber)
            .transactionId("TXN_" + System.currentTimeMillis())
            .timestamp(Instant.now())
            .captureTime(Instant.now())
            .readingTime(Instant.now())
            .collectionTime(Instant.now())
            .rtcTime(Instant.now().toString())
            .activeEnergyImport(BigDecimal.ZERO)
            .activeEnergyExport(BigDecimal.ZERO)
            .reactiveEnergyImport(BigDecimal.ZERO)
            .reactiveEnergyExport(BigDecimal.ZERO)
            .apparentEnergy(BigDecimal.ZERO)
            .cumEnergyWhImport(0.0)
            .cumEnergyWhExport(0.0)
            .activePowerImport(BigDecimal.ZERO)
            .activePowerExport(BigDecimal.ZERO)
            .reactivePowerImport(BigDecimal.ZERO)
            .reactivePowerExport(BigDecimal.ZERO)
            .apparentPower(BigDecimal.ZERO)
            .activePower(0.0)
            .reactivePower(0.0)
            .apparentPowerDouble(0.0)
            .voltageL1(BigDecimal.valueOf(230.0))
            .voltageL2(BigDecimal.valueOf(230.0))
            .voltageL3(BigDecimal.valueOf(230.0))
            .currentL1(BigDecimal.ZERO)
            .currentL2(BigDecimal.ZERO)
            .currentL3(BigDecimal.ZERO)
            .l1CurrentIr(0.0)
            .l2CurrentIy(0.0)
            .l3CurrentIb(0.0)
            .l1VoltageVrn(230.0)
            .l2VoltageVyn(230.0)
            .l3VoltageVbn(230.0)
            .powerFactor(BigDecimal.ONE)
            .frequency(BigDecimal.valueOf(50.0))
            .l1PowerFactor(1.0)
            .l2PowerFactor(1.0)
            .l3PowerFactor(1.0)
            .threePhasePf(1.0)
            .frequencyDouble(50.0)
            .maximumDemand(BigDecimal.ZERO)
            .currentDemand(BigDecimal.ZERO)
            .averageDemand(BigDecimal.ZERO)
            .readingQuality("GOOD")
            .readingStatus("SUCCESS")
            .isValid(true)
            .validationMessage("Reading validated successfully")
            .readingType("REGULAR")
            .source("DLMS")
            .notes("Default reading")
            .build();
    }
} 