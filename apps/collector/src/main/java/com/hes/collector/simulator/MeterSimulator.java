package com.hes.collector.simulator;

import com.hes.data.entities.*;
import com.hes.common.repository.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Data
@Component
public class MeterSimulator {
    private final Random random = new Random();
    private final List<SimulatedMeter> simulatedMeters = new ArrayList<>();
    private final JdbcTemplate jdbcTemplate;
    private final MeterRepository meterRepository;

    public MeterSimulator(JdbcTemplate jdbcTemplate, MeterRepository meterRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.meterRepository = meterRepository;
        loadMeters();
    }

    private void loadMeters() {
        List<Meter> meters = meterRepository.findAll();
        for (Meter meter : meters) {
            addMeter(meter);
        }
        log.info("Loaded {} meters for simulation", simulatedMeters.size());
    }

    public void addMeter(Meter meter) {
        simulatedMeters.add(new SimulatedMeter(meter));
        log.info("Added simulated meter: {}", meter.getSerialNumber());
    }

    @Scheduled(fixedRate = 30000) // Generate readings every 30 seconds
    public void generateAndSaveReadings() {
        List<MeterReading> readings = generateReadings();
        log.info("Generated {} readings", readings.size());
    }

    public List<MeterReading> generateReadings() {
        List<MeterReading> readings = new ArrayList<>();
        Instant now = Instant.now();

        for (SimulatedMeter simMeter : simulatedMeters) {
            // Generate and save different types of readings
            generateAndSaveInstantaneousReadings(simMeter, now);
            generateAndSaveBlockLoadProfile(simMeter, now);
            generateAndSaveDailyLoadProfile(simMeter, now);
            generateAndSaveBillingProfile(simMeter, now);
        }

        return readings;
    }

    private void generateAndSaveInstantaneousReadings(SimulatedMeter simMeter, Instant now) {
        // Create instantaneous profile
        String sql = "INSERT INTO instantaneous_profiles (id, meter_id, capture_time, power_factor, frequency, " +
                    "voltage_r, voltage_y, voltage_b, current_r, current_y, current_b, active_power_import, " +
                    "active_power_export, reactive_power_import, reactive_power_export) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        UUID profileId = UUID.randomUUID();
        jdbcTemplate.update(sql,
            profileId,
            simMeter.getMeter().getId(),
            Timestamp.from(now),
            simMeter.generatePowerFactor(),
            simMeter.generateFrequency(),
            simMeter.generateVoltage(),
            simMeter.generateVoltage(),
            simMeter.generateVoltage(),
            simMeter.generateCurrent(),
            simMeter.generateCurrent(),
            simMeter.generateCurrent(),
            simMeter.generateActivePowerImport(),
            simMeter.generateActivePowerExport(),
            simMeter.generateReactivePower(),
            simMeter.generateReactivePower()
        );
    }

    private void generateAndSaveBlockLoadProfile(SimulatedMeter simMeter, Instant now) {
        String sql = "INSERT INTO block_load_profiles (id, meter_id, capture_time, active_energy_import, " +
                    "active_energy_export, reactive_energy_import, reactive_energy_export, interval_minutes) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        UUID profileId = UUID.randomUUID();
        jdbcTemplate.update(sql,
            profileId,
            simMeter.getMeter().getId(),
            Timestamp.from(now),
            simMeter.generateActivePowerImport() * 0.25, // 15-min energy
            simMeter.generateActivePowerExport() * 0.25,
            simMeter.generateReactivePower() * 0.25,
            simMeter.generateReactivePower() * 0.25,
            15 // 15-minute intervals
        );
    }

    private void generateAndSaveDailyLoadProfile(SimulatedMeter simMeter, Instant now) {
        String sql = "INSERT INTO daily_load_profiles (id, meter_id, capture_time, active_energy_import, " +
                    "active_energy_export, reactive_energy_import, reactive_energy_export) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";

        UUID profileId = UUID.randomUUID();
        jdbcTemplate.update(sql,
            profileId,
            simMeter.getMeter().getId(),
            Timestamp.from(now),
            simMeter.generateActivePowerImport() * 24, // Daily energy
            simMeter.generateActivePowerExport() * 24,
            simMeter.generateReactivePower() * 24,
            simMeter.generateReactivePower() * 24
        );
    }

    private void generateAndSaveBillingProfile(SimulatedMeter simMeter, Instant now) {
        // Generate billing profile once per day at midnight
        LocalDateTime localNow = LocalDateTime.ofInstant(now, ZoneId.systemDefault());
        if (localNow.getHour() == 0 && localNow.getMinute() == 0) {
            String sql = "INSERT INTO billing_profiles (id, meter_id, capture_time, active_energy_import_t1, " +
                        "active_energy_import_t2, active_energy_export_t1, active_energy_export_t2, " +
                        "reactive_energy_import_t1, reactive_energy_import_t2, maximum_demand_t1, maximum_demand_t2) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            UUID profileId = UUID.randomUUID();
            jdbcTemplate.update(sql,
                profileId,
                simMeter.getMeter().getId(),
                Timestamp.from(now),
                simMeter.generateActivePowerImport() * 24 * 30, // Monthly energy T1
                simMeter.generateActivePowerImport() * 24 * 30 * 0.8, // Monthly energy T2
                simMeter.generateActivePowerExport() * 24 * 30,
                simMeter.generateActivePowerExport() * 24 * 30 * 0.8,
                simMeter.generateReactivePower() * 24 * 30,
                simMeter.generateReactivePower() * 24 * 30 * 0.8,
                simMeter.generateActivePowerImport() * 1.5, // Max demand T1
                simMeter.generateActivePowerImport() * 1.2  // Max demand T2
            );
        }
    }
}