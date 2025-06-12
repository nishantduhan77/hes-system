package com.hes.collector.simulator;

import com.hes.data.entities.*;
import com.hes.common.repository.*;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Data
@Component
public class CollectorMeterSimulator {
    private static final Logger log = LoggerFactory.getLogger(CollectorMeterSimulator.class);
    private final Random random = new Random();
    private final List<SimulatedMeter> simulatedMeters = new ArrayList<>();
    private final JdbcTemplate jdbcTemplate;
    private final MeterRepository meterRepository;
    private final DateTimeFormatter rtcFormatter = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    public CollectorMeterSimulator(JdbcTemplate jdbcTemplate, MeterRepository meterRepository) {
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

    public List<MeterReading> generateReadings() {
        List<MeterReading> readings = new ArrayList<>();
        Instant now = Instant.now();
        
        log.info("Starting to generate readings for {} meters at {}", simulatedMeters.size(), now);

        for (SimulatedMeter simMeter : simulatedMeters) {
            try {
                // Generate and save different types of readings
                generateAndSaveInstantaneousReadings(simMeter, now);
                generateAndSaveBlockLoadProfile(simMeter, now);
                generateAndSaveDailyLoadProfile(simMeter, now);
                generateAndSaveBillingProfile(simMeter, now);
                
                // Randomly generate events (1% chance)
                if (random.nextDouble() < 0.01) {
                    generateAndSaveEvent(simMeter, now);
                }
                
                log.debug("Generated readings for meter: {}", simMeter.getMeter().getSerialNumber());
            } catch (Exception e) {
                log.error("Error generating readings for meter {}: {}", 
                    simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
            }
        }

        log.info("Completed generating readings for {} meters", simulatedMeters.size());
        return readings;
    }

    private String formatRtcTime(Instant instant) {
        return rtcFormatter.format(instant.atZone(ZoneId.systemDefault()));
    }

    private void generateAndSaveInstantaneousReadings(SimulatedMeter simMeter, Instant now) {
        try {
            String sql = "INSERT INTO instantaneous_profiles (meter_serial_number, capture_time, rtc_time, " +
                        "l1_current_ir, l2_current_iy, l3_current_ib, " +
                        "l1_voltage_vrn, l2_voltage_vyn, l3_voltage_vbn, " +
                        "l1_power_factor, l2_power_factor, l3_power_factor, " +
                        "three_phase_pf, frequency, apparent_power, active_power, reactive_power, " +
                        "cum_energy_wh_import, cum_energy_wh_export) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            Timestamp timestamp = Timestamp.from(now);
            String rtcTime = formatRtcTime(now);
            
            int rowsInserted = jdbcTemplate.update(sql,
                simMeter.getMeter().getSerialNumber(),
                timestamp,
                rtcTime,
                simMeter.generateCurrent(),
                simMeter.generateCurrent(),
                simMeter.generateCurrent(),
                simMeter.generateVoltage(),
                simMeter.generateVoltage(),
                simMeter.generateVoltage(),
                simMeter.generatePowerFactor(),
                simMeter.generatePowerFactor(),
                simMeter.generatePowerFactor(),
                simMeter.generatePowerFactor(),
                simMeter.generateFrequency(),
                simMeter.generateApparentPower(),
                simMeter.generateActivePowerImport(),
                simMeter.generateReactivePower(),
                simMeter.generateCumulativeEnergy(),
                simMeter.generateCumulativeEnergy() * 0.1
            );
            
            log.debug("Inserted {} instantaneous reading for meter {}", rowsInserted, simMeter.getMeter().getSerialNumber());
        } catch (Exception e) {
            log.error("Failed to insert instantaneous reading for meter {}: {}", 
                simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
        }
    }

    private void generateAndSaveBlockLoadProfile(SimulatedMeter simMeter, Instant now) {
        try {
            // Only generate block load profile every 15 minutes
            LocalDateTime localNow = LocalDateTime.ofInstant(now, ZoneId.systemDefault());
            if (localNow.getMinute() % 15 == 0) {
                String sql = "INSERT INTO block_load_profiles (meter_serial_number, capture_time, rtc_time, " +
                            "current_ir, current_iy, current_ib, " +
                            "voltage_vrn, voltage_vyn, voltage_vbn, " +
                            "block_energy_wh_import, block_energy_wh_export, " +
                            "block_energy_varh_q1, block_energy_varh_q2, " +
                            "block_energy_varh_q3, block_energy_varh_q4, " +
                            "block_energy_vah_import, block_energy_vah_export, " +
                            "meter_health_indicator, signal_strength) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                Timestamp timestamp = Timestamp.from(now);
                String rtcTime = formatRtcTime(now);
                
                int rowsInserted = jdbcTemplate.update(sql,
                    simMeter.getMeter().getSerialNumber(),
                    timestamp,
                    rtcTime,
                    simMeter.generateCurrent(),
                    simMeter.generateCurrent(),
                    simMeter.generateCurrent(),
                    simMeter.generateVoltage(),
                    simMeter.generateVoltage(),
                    simMeter.generateVoltage(),
                    simMeter.generateBlockEnergy(),
                    simMeter.generateBlockEnergy() * 0.1,
                    simMeter.generateBlockEnergy() * 0.25,
                    simMeter.generateBlockEnergy() * 0.25,
                    simMeter.generateBlockEnergy() * 0.25,
                    simMeter.generateBlockEnergy() * 0.25,
                    simMeter.generateBlockEnergy() * 1.1,
                    simMeter.generateBlockEnergy() * 0.1,
                    1, // Healthy
                    random.nextInt(31) // 0-30 signal strength
                );
                
                log.debug("Inserted {} block load profile for meter {} at 15-min mark", 
                    rowsInserted, simMeter.getMeter().getSerialNumber());
            }
        } catch (Exception e) {
            log.error("Failed to insert block load profile for meter {}: {}", 
                simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
        }
    }

    private void generateAndSaveDailyLoadProfile(SimulatedMeter simMeter, Instant now) {
        try {
            // Generate daily profile at midnight
            LocalDateTime localNow = LocalDateTime.ofInstant(now, ZoneId.systemDefault());
            if (localNow.getHour() == 0 && localNow.getMinute() == 0) {
                String sql = "INSERT INTO daily_load_profiles (meter_serial_number, capture_time, rtc_time, " +
                            "cum_energy_wh_import, cum_energy_wh_export, " +
                            "cum_energy_vah_import, cum_energy_vah_export, " +
                            "cum_energy_varh_q1, cum_energy_varh_q2, " +
                            "cum_energy_varh_q3, cum_energy_varh_q4, " +
                            "max_demand_w, max_demand_w_datetime) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                double dailyEnergy = simMeter.generateDailyEnergy();
                Timestamp timestamp = Timestamp.from(now);
                String rtcTime = formatRtcTime(now);
                
                int rowsInserted = jdbcTemplate.update(sql,
                    simMeter.getMeter().getSerialNumber(),
                    timestamp,
                    rtcTime,
                    dailyEnergy,
                    dailyEnergy * 0.1,
                    dailyEnergy * 1.1,
                    dailyEnergy * 0.1,
                    dailyEnergy * 0.25,
                    dailyEnergy * 0.25,
                    dailyEnergy * 0.25,
                    dailyEnergy * 0.25,
                    simMeter.generateMaxDemand(),
                    Timestamp.from(now.minusSeconds(random.nextInt(86400))) // Random time in last 24h
                );
                
                log.info("Inserted {} daily load profile for meter {} at midnight", 
                    rowsInserted, simMeter.getMeter().getSerialNumber());
            }
        } catch (Exception e) {
            log.error("Failed to insert daily load profile for meter {}: {}", 
                simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
        }
    }

    private void generateAndSaveBillingProfile(SimulatedMeter simMeter, Instant now) {
        try {
            // Generate billing profile at midnight on the 1st of the month
            LocalDateTime localNow = LocalDateTime.ofInstant(now, ZoneId.systemDefault());
            if (localNow.getDayOfMonth() == 1 && localNow.getHour() == 0 && localNow.getMinute() == 0) {
                String sql = "INSERT INTO billing_profiles (meter_serial_number, billing_date, rtc_time, " +
                            "cum_energy_wh_import, cum_energy_wh_export, " +
                            "cum_energy_vah_import, cum_energy_vah_export, " +
                            "cum_energy_varh_q1, cum_energy_varh_q2, " +
                            "cum_energy_varh_q3, cum_energy_varh_q4, " +
                            "md_w_import, md_w_datetime) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                double monthlyEnergy = simMeter.generateMonthlyEnergy();
                Timestamp timestamp = Timestamp.from(now);
                String rtcTime = formatRtcTime(now);
                
                int rowsInserted = jdbcTemplate.update(sql,
                    simMeter.getMeter().getSerialNumber(),
                    timestamp,
                    rtcTime,
                    monthlyEnergy,
                    monthlyEnergy * 0.1,
                    monthlyEnergy * 1.1,
                    monthlyEnergy * 0.1,
                    monthlyEnergy * 0.25,
                    monthlyEnergy * 0.25,
                    monthlyEnergy * 0.25,
                    monthlyEnergy * 0.25,
                    simMeter.generateMaxDemand(),
                    Timestamp.from(now.minusSeconds(random.nextInt(2592000))) // Random time in last month
                );
                
                log.info("Inserted {} billing profile for meter {} at month start", 
                    rowsInserted, simMeter.getMeter().getSerialNumber());
            }
        } catch (Exception e) {
            log.error("Failed to insert billing profile for meter {}: {}", 
                simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
        }
    }

    private void generateAndSaveEvent(SimulatedMeter simMeter, Instant now) {
        try {
            String sql = "INSERT INTO events (meter_serial_number, event_type_id, event_datetime, rtc_time, " +
                        "event_code, current_ir, voltage_vrn, power_factor) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            String rtcTime = formatRtcTime(now);
            
            int rowsInserted = jdbcTemplate.update(sql,
                simMeter.getMeter().getSerialNumber(),
                1, // Default event type
                Timestamp.from(now),
                rtcTime,
                random.nextInt(100) + 1, // Random event code 1-100
                simMeter.generateCurrent(),
                simMeter.generateVoltage(),
                simMeter.generatePowerFactor()
            );
            
            log.info("Inserted {} event for meter {}", rowsInserted, simMeter.getMeter().getSerialNumber());
        } catch (Exception e) {
            log.error("Failed to insert event for meter {}: {}", 
                simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
        }
    }
}