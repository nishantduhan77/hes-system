package com.hes.collector.service;

import com.hes.collector.model.Meter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class PingService {
    private final JdbcTemplate jdbcTemplate;
    private final RelayService relayService;

    public PingService(JdbcTemplate jdbcTemplate, RelayService relayService) {
        this.jdbcTemplate = jdbcTemplate;
        this.relayService = relayService;
    }

    @Scheduled(fixedRate = 30000) // Every 30 seconds
    public void checkMeterCommunication() {
        try {
            // Get all meters
            String sql = "SELECT meter_serial_number, last_communication FROM meters";
            List<Map<String, Object>> meters = jdbcTemplate.queryForList(sql);

            Instant now = Instant.now();
            for (Map<String, Object> meter : meters) {
                String serialNumber = (String) meter.get("meter_serial_number");
                Timestamp lastComm = (Timestamp) meter.get("last_communication");
                
                if (lastComm != null) {
                    // If no communication for more than 5 minutes, mark as disconnected
                    if (now.minusSeconds(300).isAfter(lastComm.toInstant())) {
                        relayService.disconnectMeter(serialNumber);
                        log.warn("Meter {} marked as disconnected due to no communication", serialNumber);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error checking meter communication: {}", e.getMessage(), e);
        }
    }

    public boolean updateLastCommunication(String meterSerialNumber) {
        try {
            String sql = "UPDATE meters SET last_communication = ? WHERE meter_serial_number = ?";
            int rowsUpdated = jdbcTemplate.update(sql, Timestamp.from(Instant.now()), meterSerialNumber);
            
            if (rowsUpdated > 0) {
                log.debug("Updated last communication for meter: {}", meterSerialNumber);
                return true;
            } else {
                log.warn("Meter not found for communication update: {}", meterSerialNumber);
                return false;
            }
        } catch (Exception e) {
            log.error("Error updating meter communication for {}: {}", meterSerialNumber, e.getMessage(), e);
            return false;
        }
    }

    public Instant getLastCommunication(String meterSerialNumber) {
        try {
            String sql = "SELECT last_communication FROM meters WHERE meter_serial_number = ?";
            Timestamp timestamp = jdbcTemplate.queryForObject(sql, Timestamp.class, meterSerialNumber);
            return timestamp != null ? timestamp.toInstant() : null;
        } catch (Exception e) {
            log.error("Error getting last communication for {}: {}", meterSerialNumber, e.getMessage(), e);
            return null;
        }
    }
} 