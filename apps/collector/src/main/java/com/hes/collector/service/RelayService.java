package com.hes.collector.service;

import com.hes.collector.model.Meter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.sql.Timestamp;

@Slf4j
@Service
public class RelayService {
    private final JdbcTemplate jdbcTemplate;

    public RelayService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean disconnectMeter(String meterSerialNumber) {
        try {
            String sql = "UPDATE meters SET status = 'DISCONNECTED', last_communication = ? WHERE meter_serial_number = ?";
            int rowsUpdated = jdbcTemplate.update(sql, Timestamp.from(Instant.now()), meterSerialNumber);
            
            if (rowsUpdated > 0) {
                log.info("Successfully disconnected meter: {}", meterSerialNumber);
                return true;
            } else {
                log.warn("Meter not found for disconnection: {}", meterSerialNumber);
                return false;
            }
        } catch (Exception e) {
            log.error("Error disconnecting meter {}: {}", meterSerialNumber, e.getMessage(), e);
            return false;
        }
    }

    public boolean connectMeter(String meterSerialNumber) {
        try {
            String sql = "UPDATE meters SET status = 'CONNECTED', last_communication = ? WHERE meter_serial_number = ?";
            int rowsUpdated = jdbcTemplate.update(sql, Timestamp.from(Instant.now()), meterSerialNumber);
            
            if (rowsUpdated > 0) {
                log.info("Successfully connected meter: {}", meterSerialNumber);
                return true;
            } else {
                log.warn("Meter not found for connection: {}", meterSerialNumber);
                return false;
            }
        } catch (Exception e) {
            log.error("Error connecting meter {}: {}", meterSerialNumber, e.getMessage(), e);
            return false;
        }
    }

    public String getMeterStatus(String meterSerialNumber) {
        try {
            String sql = "SELECT status FROM meters WHERE meter_serial_number = ?";
            return jdbcTemplate.queryForObject(sql, String.class, meterSerialNumber);
        } catch (Exception e) {
            log.error("Error getting meter status for {}: {}", meterSerialNumber, e.getMessage(), e);
            return "UNKNOWN";
        }
    }
} 