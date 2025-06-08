package com.hes.collector.simulator;

import com.hes.common.entity.Meter;
import com.hes.common.entity.MeterReading;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Data
@Component
public class MeterSimulator {
    private final Random random = new Random();
    private final List<SimulatedMeter> simulatedMeters = new ArrayList<>();

    public void addMeter(Meter meter) {
        simulatedMeters.add(new SimulatedMeter(meter));
        log.info("Added simulated meter: {}", meter.getSerialNumber());
    }

    
    public List<MeterReading> generateReadings() {
        List<MeterReading> readings = new ArrayList<>();
        Instant now = Instant.now();

        for (SimulatedMeter simMeter : simulatedMeters) {
            // Generate active energy import
            readings.add(createReading(
                simMeter.getMeter().getId(),
                now,
                MeterReading.ReadingType.ACTIVE_ENERGY_IMPORT,
                simMeter.generateActiveEnergyImport(),
                MeterReading.Unit.KWH
            ));

            // Generate voltage readings for each phase
            readings.add(createReading(
                simMeter.getMeter().getId(),
                now,
                MeterReading.ReadingType.VOLTAGE_L1,
                simMeter.generateVoltage(),
                MeterReading.Unit.V
            ));

            readings.add(createReading(
                simMeter.getMeter().getId(),
                now,
                MeterReading.ReadingType.VOLTAGE_L2,
                simMeter.generateVoltage(),
                MeterReading.Unit.V
            ));

            readings.add(createReading(
                simMeter.getMeter().getId(),
                now,
                MeterReading.ReadingType.VOLTAGE_L3,
                simMeter.generateVoltage(),
                MeterReading.Unit.V
            ));

            // Generate current readings for each phase
            readings.add(createReading(
                simMeter.getMeter().getId(),
                now,
                MeterReading.ReadingType.CURRENT_L1,
                simMeter.generateCurrent(),
                MeterReading.Unit.A
            ));

            readings.add(createReading(
                simMeter.getMeter().getId(),
                now,
                MeterReading.ReadingType.CURRENT_L2,
                simMeter.generateCurrent(),
                MeterReading.Unit.A
            ));

            readings.add(createReading(
                simMeter.getMeter().getId(),
                now,
                MeterReading.ReadingType.CURRENT_L3,
                simMeter.generateCurrent(),
                MeterReading.Unit.A
            ));

            // Generate frequency
            readings.add(createReading(
                simMeter.getMeter().getId(),
                now,
                MeterReading.ReadingType.FREQUENCY,
                simMeter.generateFrequency(),
                MeterReading.Unit.HZ
            ));
        }

        return readings;
    }

    private MeterReading createReading(UUID meterId, Instant timestamp,
                                     MeterReading.ReadingType type,
                                     double value, MeterReading.Unit unit) {
        MeterReading reading = new MeterReading();
        reading.setMeterId(meterId);
        reading.setTimestamp(timestamp);
        reading.setReadingType(type);
        reading.setValue(value);
        reading.setUnit(unit.getSymbol());
        return reading;
    }

    @Data
    private class SimulatedMeter {
        private final Meter meter;
        private double lastActiveEnergyImport = 0.0;
        private static final double BASE_LOAD = 5.0; // Base load in kW
        private static final double LOAD_VARIATION = 2.0; // Load variation in kW

        public SimulatedMeter(Meter meter) {
            this.meter = meter;
        }

        public double generateActiveEnergyImport() {
            // Generate realistic consumption pattern
            double loadKW = BASE_LOAD + (random.nextDouble() * LOAD_VARIATION);
            // Convert power to energy for 30-minute interval
            double energyIncrement = loadKW * 0.5; // kWh for 30 minutes
            lastActiveEnergyImport += energyIncrement;
            return lastActiveEnergyImport;
        }

        public double generateVoltage() {
            // Generate voltage with small variations around 230V
            return 230.0 + (random.nextGaussian() * 2.0);
        }

        public double generateCurrent() {
            // Generate current based on power and voltage
            double powerKW = BASE_LOAD + (random.nextDouble() * LOAD_VARIATION);
            return (powerKW * 1000) / (230.0 * Math.sqrt(3)); // Convert to Amps
        }

        public double generateFrequency() {
            // Generate frequency with small variations around 50Hz
            return 50.0 + (random.nextGaussian() * 0.1);
        }
    }
} 