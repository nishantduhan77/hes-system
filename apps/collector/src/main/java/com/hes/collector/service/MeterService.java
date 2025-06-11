package com.hes.collector.service;

import com.hes.data.entities.Meter;
import com.hes.common.entity.MeterStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
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
            meter.getSerialNumber(),
            meter.getDeviceId(),
            meter.getManufacturer(),
            meter.getFirmwareVersion(),
            meter.getMeterType(),
            meter.getMeterCategory(),
            meter.getCurrentRating(),
            meter.getYearOfManufacture(),
            meter.getCtr(),
            meter.getPtr(),
            meter.getStatus() != null ? meter.getStatus().toString() : "DISCONNECTED",
            meter.getLastCommunication(),
            meter.getProtocolVersion(),
            meter.getIpAddress(),
            meter.getPort(),
            meter.getGroup() != null ? meter.getGroup().getId() : null,
            meter.getCreatedAt(),
            meter.getUpdatedAt()
        );
    }

    private Meter mapRowToMeter(ResultSet rs, int rowNum) throws SQLException {
        Meter meter = new Meter();
        meter.setSerialNumber(rs.getString("meter_serial_number"));
        meter.setDeviceId(rs.getString("device_id"));
        meter.setManufacturer(rs.getString("manufacturer_name"));
        meter.setFirmwareVersion(rs.getString("firmware_version"));
        meter.setMeterType(rs.getInt("meter_type"));
        meter.setMeterCategory(rs.getString("meter_category"));
        meter.setCurrentRating(rs.getString("current_rating"));
        meter.setYearOfManufacture(rs.getInt("year_of_manufacture"));
        meter.setCtr(rs.getLong("ctr"));
        meter.setPtr(rs.getLong("ptr"));
        meter.setStatus(rs.getString("status") != null ? MeterStatus.valueOf(rs.getString("status")) : MeterStatus.DISCONNECTED);
        meter.setLastCommunication(rs.getTimestamp("last_communication") != null ? 
            rs.getTimestamp("last_communication").toInstant() : null);
        meter.setProtocolVersion(rs.getString("protocol_version"));
        meter.setIpAddress(rs.getString("ip_address"));
        meter.setPort(rs.getInt("port"));
        // Note: group_id is handled by JPA relationships, not set here directly
        meter.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant() : null);
        meter.setUpdatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toInstant() : null);
        return meter;
    }
} 