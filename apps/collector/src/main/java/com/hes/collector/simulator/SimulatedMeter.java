package com.hes.collector.simulator;

import com.hes.data.entities.Meter;
import lombok.Data;

import java.util.Random;

@Data
public class SimulatedMeter {
    private final Meter meter;
    private final Random random = new Random();

    // Base values for simulation
    private double baseActivePower = 5000.0; // 5 kW
    private double baseReactivePower = 1000.0; // 1 kVAr
    private double baseVoltage = 230.0; // 230V
    private double baseCurrent = 20.0; // 20A
    private double baseFrequency = 50.0; // 50Hz
    private double basePowerFactor = 0.95; // 0.95

    // Variation ranges (in percentage)
    private double powerVariation = 0.2; // 20%
    private double voltageVariation = 0.05; // 5%
    private double currentVariation = 0.15; // 15%
    private double frequencyVariation = 0.001; // 0.1%
    private double powerFactorVariation = 0.05; // 5%

    public SimulatedMeter(Meter meter) {
        this.meter = meter;
    }

    public Meter getMeter() {
        return meter;
    }

    public double generateActivePowerImport() {
        return random.nextDouble() * 5000; // 0-5kW
    }

    public double generateActivePowerExport() {
        return random.nextDouble() * 2000; // 0-2kW
    }

    public double generateReactivePower() {
        return random.nextDouble() * 2000; // 0-2kVAR
    }

    public double generateVoltage() {
        return 230 + (random.nextDouble() * 20 - 10); // 220-240V
    }

    public double generateCurrent() {
        return random.nextDouble() * 20; // 0-20A
    }

    public double generatePowerFactor() {
        return 0.8 + (random.nextDouble() * 0.2); // 0.8-1.0
    }

    public double generateFrequency() {
        return 50 + (random.nextDouble() * 0.2 - 0.1); // 49.9-50.1Hz
    }

    public double generateApparentPower() {
        return generateActivePowerImport() / generatePowerFactor(); // S = P/PF
    }

    public double generateBlockEnergy() {
        return generateActivePowerImport() * 0.25; // 15-min energy in Wh
    }

    public double generateDailyEnergy() {
        return generateActivePowerImport() * 24; // Daily energy in Wh
    }

    public double generateMonthlyEnergy() {
        return generateActivePowerImport() * 24 * 30; // Monthly energy in Wh
    }

    public double generateMaxDemand() {
        return generateActivePowerImport() * 1.5; // Peak demand 50% higher than average
    }

    public double generateCumulativeEnergy() {
        return random.nextDouble() * 1000000; // Random cumulative energy up to 1MWh
    }
} 