package com.hes.collector.simulator;

import com.hes.collector.model.Meter;
import com.hes.collector.model.MeterReading;
import com.hes.collector.model.MeterTransaction;
import com.hes.collector.repository.CollectorMeterRepository;
import com.hes.collector.service.RelayService;
import com.hes.collector.service.PingService;
import com.hes.collector.enums.EswfBit;
import com.hes.collector.enums.MeterEvent;
import com.hes.collector.dlms.DlmsProtocol;
import com.hes.collector.dlms.CosemObject;
import com.hes.collector.dlms.DataObject;
import com.hes.collector.dlms.security.SecuritySuite;
import com.hes.collector.config.DlmsConfig;
import com.hes.collector.service.MeterCommunicationService;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.BitSet;
import java.util.concurrent.CompletableFuture;

@Data
@Component
public class CollectorMeterSimulator {
    private static final Logger log = LoggerFactory.getLogger(CollectorMeterSimulator.class);
    private final Random random = new Random();
    private final List<SimulatedMeter> simulatedMeters = new ArrayList<>();
    private final JdbcTemplate jdbcTemplate;
    private final CollectorMeterRepository meterRepository;
    private final RelayService relayService;
    private final PingService pingService;
    private final MeterCommunicationService meterCommunicationService;
    private final DlmsConfig dlmsConfig;
    private final DateTimeFormatter rtcFormatter = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    public CollectorMeterSimulator(JdbcTemplate jdbcTemplate, CollectorMeterRepository meterRepository,
                                 RelayService relayService, PingService pingService,
                                 MeterCommunicationService meterCommunicationService,
                                 DlmsConfig dlmsConfig) {
        this.jdbcTemplate = jdbcTemplate;
        this.meterRepository = meterRepository;
        this.relayService = relayService;
        this.pingService = pingService;
        this.meterCommunicationService = meterCommunicationService;
        this.dlmsConfig = dlmsConfig;
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

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void generateReadings() {
        List<MeterReading> readings = new ArrayList<>();
        Instant now = Instant.now();
        
        log.info("Starting to generate readings for {} meters at {}", simulatedMeters.size(), now);

        for (SimulatedMeter simMeter : simulatedMeters) {
            try {
                // Update last communication
                pingService.updateLastCommunication(simMeter.getMeter().getSerialNumber());

                // Generate and save different types of readings
                generateAndSaveInstantaneousReadings(simMeter, now);
                generateAndSaveBlockLoadProfile(simMeter, now);
                generateAndSaveDailyLoadProfile(simMeter, now);
                generateAndSaveBillingProfile(simMeter, now);
                
                // Generate events with 10% chance
                if (random.nextDouble() < 0.10) {
                    generateAndSaveEvent(simMeter, now);
                    generateAndSaveESWF(simMeter, now);
                }
                
                log.debug("Generated readings for meter: {}", simMeter.getMeter().getSerialNumber());
            } catch (Exception e) {
                log.error("Error generating readings for meter {}: {}", 
                    simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
            }
        }

        log.info("Completed generating readings for {} meters", simulatedMeters.size());
    }

    /**
     * Enhanced DLMS communication methods
     */
    @Scheduled(fixedRate = 60000) // Every minute
    public void performDlmsCommunication() {
        log.info("Starting DLMS communication cycle for {} meters", simulatedMeters.size());
        
        for (SimulatedMeter simMeter : simulatedMeters) {
            try {
                // Perform ping operation
                performPingOperation(simMeter);
                
                // Read meter data via DLMS
                performDlmsReadOperations(simMeter);
                
                // Perform relay operations occasionally
                if (random.nextDouble() < 0.05) { // 5% chance
                    performRelayOperation(simMeter);
                }
                
            } catch (Exception e) {
                log.error("Error in DLMS communication for meter {}: {}", 
                    simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
            }
        }
    }

    private void performPingOperation(SimulatedMeter simMeter) {
        if (simMeter.getMeter().getPort() == null) {
            log.warn("Simulated meter {} does not have a port. Skipping ping.", simMeter.getMeter().getSerialNumber());
            return;
        }
        try {
            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                simMeter.getMeter().getIpAddress(),
                simMeter.getMeter().getPort(),
                CosemObject.StandardObjects.CLOCK,
                null,
                false
            );

            MeterTransaction.Result result = future.get(10, java.util.concurrent.TimeUnit.SECONDS);
            
            if (result.isSuccess()) {
                log.info("Ping successful for meter: {}", simMeter.getMeter().getSerialNumber());
                pingService.updateLastCommunication(simMeter.getMeter().getSerialNumber());
            } else {
                log.warn("Ping failed for meter {}: {}", simMeter.getMeter().getSerialNumber(), result.getError());
            }
        } catch (Exception e) {
            log.error("Error performing ping for meter {}: {}", simMeter.getMeter().getSerialNumber(), e.getMessage());
        }
    }

    private void performDlmsReadOperations(SimulatedMeter simMeter) {
        if (simMeter.getMeter().getPort() == null) {
            log.warn("Simulated meter {} does not have a port. Skipping DLMS read.", simMeter.getMeter().getSerialNumber());
            return;
        }
        CosemObject[] objectsToRead = {
            CosemObject.StandardObjects.ACTIVE_POWER_IMPORT,
            CosemObject.StandardObjects.VOLTAGE_L1,
            CosemObject.StandardObjects.CURRENT_L1,
            CosemObject.StandardObjects.CLOCK
        };

        for (CosemObject object : objectsToRead) {
            try {
                CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                    simMeter.getMeter().getIpAddress(),
                    simMeter.getMeter().getPort(),
                    object,
                    null,
                    false
                );

                MeterTransaction.Result result = future.get(10, java.util.concurrent.TimeUnit.SECONDS);
                
                if (result.isSuccess()) {
                    log.debug("DLMS read successful for meter {} object {}: {}", 
                        simMeter.getMeter().getSerialNumber(), object, result.getValue());
                } else {
                    log.debug("DLMS read failed for meter {} object {}: {}", 
                        simMeter.getMeter().getSerialNumber(), object, result.getError());
                }
            } catch (Exception e) {
                log.debug("Error reading DLMS object {} for meter {}: {}", 
                    object, simMeter.getMeter().getSerialNumber(), e.getMessage());
            }
        }
    }

    private void performRelayOperation(SimulatedMeter simMeter) {
        if (simMeter.getMeter().getPort() == null) {
            log.warn("Simulated meter {} does not have a port. Skipping relay operation.", simMeter.getMeter().getSerialNumber());
            return;
        }
        try {
            // Randomly connect or disconnect
            boolean connect = random.nextBoolean();
            DataObject relayValue = DataObject.newBoolean(connect);
            
            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                simMeter.getMeter().getIpAddress(),
                simMeter.getMeter().getPort(),
                CosemObject.StandardObjects.RELAY_CONTROL,
                relayValue,
                true
            );

            MeterTransaction.Result result = future.get(10, java.util.concurrent.TimeUnit.SECONDS);
            
            if (result.isSuccess()) {
                log.info("Relay operation successful for meter {}: {}", 
                    simMeter.getMeter().getSerialNumber(), connect ? "CONNECT" : "DISCONNECT");
            } else {
                log.warn("Relay operation failed for meter {}: {}", 
                    simMeter.getMeter().getSerialNumber(), result.getError());
            }
        } catch (Exception e) {
            log.error("Error performing relay operation for meter {}: {}", 
                simMeter.getMeter().getSerialNumber(), e.getMessage());
        }
    }

    /**
     * Battery and signal stats collection (scheduled)
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void collectBatteryAndSignalStats() {
        log.info("Starting battery and signal stats collection for {} meters", simulatedMeters.size());
        
        for (SimulatedMeter simMeter : simulatedMeters) {
            try {
                // Simulate battery level reading
                int batteryLevel = 70 + random.nextInt(30); // 70-100%
                
                // Simulate signal strength reading
                int signalStrength = 60 + random.nextInt(40); // 60-100%
                
                // Save to database
                String sql = "INSERT INTO meter_health_stats (meter_serial_number, capture_time, " +
                           "battery_level, signal_strength, health_status) " +
                           "VALUES (?, ?, ?, ?, ?)";
                
                jdbcTemplate.update(sql,
                    simMeter.getMeter().getSerialNumber(),
                    Timestamp.from(Instant.now()),
                    batteryLevel,
                    signalStrength,
                    batteryLevel > 80 && signalStrength > 80 ? "GOOD" : "WARNING"
                );
                
                log.debug("Collected health stats for meter {}: battery={}%, signal={}%", 
                    simMeter.getMeter().getSerialNumber(), batteryLevel, signalStrength);
                
            } catch (Exception e) {
                log.error("Error collecting health stats for meter {}: {}", 
                    simMeter.getMeter().getSerialNumber(), e.getMessage());
            }
        }
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
                String sql = "INSERT INTO block_load_profiles (meter_serial_number, capture_time, rtc_timestamp, " +
                            "current_ir, current_iy, current_ib, " +
                            "voltage_vrn, voltage_vyn, voltage_vbn, " +
                            "block_energy_wh_import, block_energy_wh_export, " +
                            "block_energy_varh_q1, block_energy_varh_q2, " +
                            "block_energy_varh_q3, block_energy_varh_q4, " +
                            "block_energy_vah_import, block_energy_vah_export, " +
                            "meter_health_indicator, signal_strength) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                int rowsInserted = jdbcTemplate.update(sql,
                    simMeter.getMeter().getSerialNumber(),
                    Timestamp.from(now),
                    Timestamp.from(now), // rtc_timestamp
                    simMeter.generateCurrent(),
                    simMeter.generateCurrent(),
                    simMeter.generateCurrent(),
                    simMeter.generateVoltage(),
                    simMeter.generateVoltage(),
                    simMeter.generateVoltage(),
                    simMeter.generateBlockEnergy(),
                    simMeter.generateBlockEnergy() * 0.1, // 10% export
                    simMeter.generateBlockEnergy() * 0.2, // Q1
                    simMeter.generateBlockEnergy() * 0.3, // Q2
                    simMeter.generateBlockEnergy() * 0.4, // Q3
                    simMeter.generateBlockEnergy() * 0.5, // Q4
                    simMeter.generateBlockEnergy() * 1.1, // VAH import
                    simMeter.generateBlockEnergy() * 0.11, // VAH export
                    random.nextInt(100), // Health indicator 0-99
                    (short)random.nextInt(100) // Signal strength 0-99
                );
                
                log.info("Inserted {} block load profile for meter {} at 15-min mark", 
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
                String sql = "INSERT INTO daily_load_profiles (meter_serial_number, capture_time, rtc_timestamp, " +
                            "cum_energy_wh_import, cum_energy_wh_export, " +
                            "cum_energy_vah_import, cum_energy_vah_export, " +
                            "cum_energy_varh_q1, cum_energy_varh_q2, " +
                            "cum_energy_varh_q3, cum_energy_varh_q4, " +
                            "max_demand_w, max_demand_w_datetime) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                double dailyEnergy = simMeter.generateDailyEnergy();
                Timestamp timestamp = Timestamp.from(now);
                
                int rowsInserted = jdbcTemplate.update(sql,
                    simMeter.getMeter().getSerialNumber(),
                    timestamp,
                    timestamp, // rtc_timestamp
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
            // Generate 1-3 random events per push
            int eventCount = 1 + random.nextInt(3);
            List<MeterEvent> allEvents = Arrays.asList(MeterEvent.values());
            Collections.shuffle(allEvents, random);
            for (int i = 0; i < eventCount; i++) {
                MeterEvent event = allEvents.get(i);
                String sql = "INSERT INTO events (meter_serial_number, event_type_id, event_datetime, event_code, rtc_timestamp) " +
                            "VALUES (?, ?, ?, ?, ?)";
                jdbcTemplate.update(sql,
                    simMeter.getMeter().getSerialNumber(),
                    event.getEventId(),
                    Timestamp.from(now),
                    event.getEventId(),
                    Timestamp.from(now)
                );
                log.info("Inserted event {} for meter {}: {}", event.getEventId(), simMeter.getMeter().getSerialNumber(), event.getEventName());
            }
        } catch (Exception e) {
            log.error("Failed to insert event for meter {}: {}", 
                simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
        }
    }

    private void generateAndSaveESWF(SimulatedMeter simMeter, Instant now) {
        try {
            // Randomly set 1-4 bits high per push
            BitSet bits = new BitSet(128);
            List<EswfBit> allBits = Arrays.asList(EswfBit.values());
            Collections.shuffle(allBits, random);
            int bitCount = 1 + random.nextInt(4);
            for (int i = 0; i < bitCount; i++) {
                bits.set(allBits.get(i).getBitNumber());
            }
            String bitString = toBitString(bits, 128);
            String sql = "INSERT INTO eswf_alarms (meter_serial_number, alarm_datetime, bits, rtc_timestamp) VALUES (?, ?, B'" + bitString + "', ?)";
            jdbcTemplate.update(sql,
                simMeter.getMeter().getSerialNumber(),
                Timestamp.from(now),
                Timestamp.from(now)
            );
            log.info("Inserted ESWF alarm for meter {} with bits {}", simMeter.getMeter().getSerialNumber(), bitString);
        } catch (Exception e) {
            log.error("Failed to insert ESWF alarm for meter {}: {}", 
                simMeter.getMeter().getSerialNumber(), e.getMessage(), e);
        }
    }

    private String toBitString(BitSet bits, int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(bits.get(i) ? '1' : '0');
        }
        return sb.toString();
    }
}