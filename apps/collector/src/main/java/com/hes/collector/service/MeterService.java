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

    public Meter getMeterById(UUID id) {
        String sql = "SELECT * FROM meters WHERE meter_id = ?";
        return jdbcTemplate.queryForObject(sql, this::mapRowToMeter, id);
    }

    public void saveMeter(Meter meter) {
        String sql = "INSERT INTO meters (meter_id, meter_code, serial_number, manufacturer, model, meter_type, location, firmware_version, installation_date, status, last_communication) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
            meter.getId(),
            meter.getMeterCode(),
            meter.getSerialNumber(),
            meter.getManufacturer(),
            meter.getModel(),
            meter.getMeterType(),
            meter.getLocation(),
            meter.getFirmwareVersion(),
            meter.getInstallationDate(),
            meter.getStatus().toString(),
            meter.getLastCommunication()
        );
    }

    private Meter mapRowToMeter(ResultSet rs, int rowNum) throws SQLException {
        Meter meter = new Meter();
        meter.setId(UUID.fromString(rs.getString("meter_id")));
        meter.setMeterCode(rs.getString("meter_code"));
        meter.setSerialNumber(rs.getString("serial_number"));
        meter.setManufacturer(rs.getString("manufacturer"));
        meter.setModel(rs.getString("model"));
        meter.setMeterType(rs.getString("meter_type"));
        meter.setLocation(rs.getString("location"));
        meter.setFirmwareVersion(rs.getString("firmware_version"));
        meter.setInstallationDate(rs.getTimestamp("installation_date").toInstant());
        meter.setStatus(MeterStatus.valueOf(rs.getString("status")));
        meter.setLastCommunication(rs.getTimestamp("last_communication") != null ? 
            rs.getTimestamp("last_communication").toInstant() : null);
        meter.setCreatedAt(rs.getTimestamp("created_at").toInstant());
        meter.setUpdatedAt(rs.getTimestamp("updated_at").toInstant());
        return meter;
    }
} 