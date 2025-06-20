package com.hes.collector.service;

import com.hes.collector.model.Meter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MeterService {
    private final JdbcTemplate jdbcTemplate;

    public MeterService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Meter> getAllMeters() {
        String sql = "SELECT * FROM meters";
        return jdbcTemplate.query(sql, this::mapRowToMeter);
    }

    public Meter getMeterBySerialNumber(String serialNumber) {
        String sql = "SELECT * FROM meters WHERE meter_serial_number = ?";
        return jdbcTemplate.queryForObject(sql, this::mapRowToMeter, serialNumber);
    }

    public void saveMeter(Meter meter) {
        String sql = "INSERT INTO meters (meter_serial_number, device_id, manufacturer_name, firmware_version, meter_type, meter_category, current_rating, year_of_manufacture, ctr, ptr, status, last_communication, protocol_version, ip_address, port, group_id, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
            meter.getMeterSerialNumber(),
            meter.getDeviceId(),
            meter.getManufacturerName(),
            meter.getFirmwareVersion(),
            meter.getMeterType(),
            meter.getMeterCategory(),
            meter.getCurrentRating(),
            meter.getYearOfManufacture(),
            meter.getCtr(),
            meter.getPtr(),
            meter.getStatus() != null ? meter.getStatus() : "DISCONNECTED",
            meter.getLastCommunication(),
            meter.getProtocolVersion(),
            meter.getIpAddress(),
            meter.getPort(),
            meter.getGroupId(),
            meter.getCreatedAt() != null ? meter.getCreatedAt() : LocalDateTime.now(),
            meter.getUpdatedAt() != null ? meter.getUpdatedAt() : LocalDateTime.now()
        );
    }

    public void updateLastCommunication(String meterSerialNumber) {
        String sql = "UPDATE meters SET last_communication = ?, updated_at = ? WHERE meter_serial_number = ?";
        jdbcTemplate.update(sql, LocalDateTime.now(), LocalDateTime.now(), meterSerialNumber);
    }

    public void updateMeterStatus(String meterSerialNumber, String status) {
        String sql = "UPDATE meters SET status = ?, updated_at = ? WHERE meter_serial_number = ?";
        jdbcTemplate.update(sql, status, LocalDateTime.now(), meterSerialNumber);
    }

    private Meter mapRowToMeter(ResultSet rs, int rowNum) throws SQLException {
        Meter meter = new Meter();
        meter.setMeterSerialNumber(rs.getString("meter_serial_number"));
        meter.setDeviceId(rs.getString("device_id"));
        meter.setManufacturerName(rs.getString("manufacturer_name"));
        meter.setFirmwareVersion(rs.getString("firmware_version"));
        meter.setMeterType(rs.getObject("meter_type", Integer.class));
        meter.setMeterCategory(rs.getString("meter_category"));
        meter.setCurrentRating(rs.getString("current_rating"));
        meter.setYearOfManufacture(rs.getObject("year_of_manufacture", Integer.class));
        meter.setCtr(rs.getObject("ctr", Long.class));
        meter.setPtr(rs.getObject("ptr", Long.class));
        meter.setCreatedAt(rs.getTimestamp("created_at") != null ? 
            rs.getTimestamp("created_at").toLocalDateTime() : null);
        meter.setUpdatedAt(rs.getTimestamp("updated_at") != null ? 
            rs.getTimestamp("updated_at").toLocalDateTime() : null);
        meter.setGroupId(rs.getObject("group_id", UUID.class));
        meter.setStatus(rs.getString("status") != null ? rs.getString("status") : "DISCONNECTED");
        meter.setLastCommunication(rs.getTimestamp("last_communication") != null ? 
            rs.getTimestamp("last_communication").toLocalDateTime() : null);
        meter.setProtocolVersion(rs.getString("protocol_version"));
        meter.setIpAddress(rs.getString("ip_address"));
        meter.setPort(rs.getObject("port", Integer.class));
        return meter;
    }
} 