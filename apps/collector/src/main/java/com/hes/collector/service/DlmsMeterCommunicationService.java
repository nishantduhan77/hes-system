package com.hes.collector.service;

import com.hes.collector.model.MeterTransaction;
import com.hes.collector.model.Meter;
import com.hes.collector.enums.MeterEvent;
import com.hes.collector.enums.EswfBit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.BitSet;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
@Service
public class DlmsMeterCommunicationService {
    private final JdbcTemplate jdbcTemplate;
    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int READ_TIMEOUT_MS = 10000;

    public DlmsMeterCommunicationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean executePingCommand(Meter meter) {
        try {
            // Create DLMS connection
            DlmsConnection connection = createConnection(meter);
            boolean success = connection.ping();
            
            if (success) {
                logEvent(meter.getSerialNumber(), MeterEvent.PING_SUCCESS, "Ping successful");
            } else {
                logEvent(meter.getSerialNumber(), MeterEvent.PING_FAILED, "Ping failed");
                setEswfBit(meter.getSerialNumber(), EswfBit.COMMUNICATION_ERROR);
            }
            
            return success;
        } catch (Exception e) {
            log.error("Error executing ping command for meter {}: {}", meter.getSerialNumber(), e.getMessage());
            logEvent(meter.getSerialNumber(), MeterEvent.PING_FAILED, e.getMessage());
            setEswfBit(meter.getSerialNumber(), EswfBit.COMMUNICATION_ERROR);
            return false;
        }
    }

    public boolean executeRelayCommand(Meter meter, boolean connect) {
        try {
            DlmsConnection connection = createConnection(meter);
            boolean success = connection.setRelay(connect);
            
            if (success) {
                MeterEvent event = connect ? MeterEvent.RELAY_CONNECTED : MeterEvent.RELAY_DISCONNECTED;
                logEvent(meter.getSerialNumber(), event, "Relay operation successful");
            } else {
                logEvent(meter.getSerialNumber(), MeterEvent.RELAY_OPERATION_FAILED, "Relay operation failed");
                setEswfBit(meter.getSerialNumber(), EswfBit.RELAY_ERROR);
            }
            
            return success;
        } catch (Exception e) {
            log.error("Error executing relay command for meter {}: {}", meter.getSerialNumber(), e.getMessage());
            logEvent(meter.getSerialNumber(), MeterEvent.RELAY_OPERATION_FAILED, e.getMessage());
            setEswfBit(meter.getSerialNumber(), EswfBit.RELAY_ERROR);
            return false;
        }
    }

    private void logEvent(String meterSerialNumber, MeterEvent event, String description) {
        try {
            String sql = "INSERT INTO events (meter_serial_number, event_type_id, event_datetime, event_code, description) " +
                        "VALUES (?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                meterSerialNumber,
                event.getEventId(),
                Instant.now(),
                event.getEventId(),
                description
            );
        } catch (Exception e) {
            log.error("Error logging event for meter {}: {}", meterSerialNumber, e.getMessage());
        }
    }

    private void setEswfBit(String meterSerialNumber, EswfBit bit) {
        try {
            // Get current ESWF bits
            String selectSql = "SELECT bits FROM eswf_alarms WHERE meter_serial_number = ? ORDER BY alarm_datetime DESC LIMIT 1";
            BitSet currentBits = jdbcTemplate.queryForObject(selectSql, (rs, rowNum) -> {
                String bitString = rs.getString("bits");
                BitSet bits = new BitSet(128);
                for (int i = 0; i < bitString.length(); i++) {
                    if (bitString.charAt(i) == '1') {
                        bits.set(i);
                    }
                }
                return bits;
            }, meterSerialNumber);

            if (currentBits == null) {
                currentBits = new BitSet(128);
            }

            // Set the new bit
            currentBits.set(bit.getBitNumber());

            // Convert BitSet to string
            StringBuilder bitString = new StringBuilder();
            for (int i = 0; i < 128; i++) {
                bitString.append(currentBits.get(i) ? '1' : '0');
            }

            // Insert new ESWF alarm
            String insertSql = "INSERT INTO eswf_alarms (meter_serial_number, alarm_datetime, bits) VALUES (?, ?, B'" + bitString.toString() + "')";
            jdbcTemplate.update(insertSql, meterSerialNumber, Instant.now());
        } catch (Exception e) {
            log.error("Error setting ESWF bit for meter {}: {}", meterSerialNumber, e.getMessage());
        }
    }

    private DlmsConnection createConnection(Meter meter) {
        return DlmsConnection.builder()
            .ipAddress(meter.getIpAddress())
            .port(meter.getPort())
            .deviceId(meter.getDeviceId())
            .connectTimeout(CONNECT_TIMEOUT_MS)
            .readTimeout(READ_TIMEOUT_MS)
            .build();
    }

    // Inner class to represent DLMS connection
    @lombok.Builder
    private static class DlmsConnection {
        private String ipAddress;
        private int port;
        private String deviceId;
        private int connectTimeout;
        private int readTimeout;

        public boolean ping() {
            // TODO: Implement actual DLMS ping
            // This would involve:
            // 1. Establishing TCP connection
            // 2. DLMS association
            // 3. Reading a simple attribute
            // 4. Releasing association
            return true;
        }

        public boolean setRelay(boolean connect) {
            // TODO: Implement actual DLMS relay control
            // This would involve:
            // 1. Establishing TCP connection
            // 2. DLMS association
            // 3. Writing to disconnect control object
            // 4. Releasing association
            return true;
        }
    }
} 