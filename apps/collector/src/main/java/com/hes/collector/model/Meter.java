package com.hes.collector.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "meters")
public class Meter {
    @Id
    @Column(name = "meter_serial_number")
    private String meterSerialNumber;
    
    @Column(name = "device_id")
    private String deviceId;
    
    @Column(name = "manufacturer_name")
    private String manufacturerName;
    
    @Column(name = "firmware_version")
    private String firmwareVersion;
    
    @Column(name = "meter_type")
    private Integer meterType;
    
    @Column(name = "meter_category")
    private String meterCategory;
    
    @Column(name = "current_rating")
    private String currentRating;
    
    @Column(name = "year_of_manufacture")
    private Integer yearOfManufacture;
    
    @Column(name = "ctr")
    private Long ctr;
    
    @Column(name = "ptr")
    private Long ptr;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "group_id")
    private UUID groupId;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "last_communication")
    private LocalDateTime lastCommunication;
    
    @Column(name = "protocol_version")
    private String protocolVersion;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "port")
    private Integer port;

    // Default constructor
    public Meter() {}

    // Constructor with all fields
    public Meter(String meterSerialNumber, String deviceId, String manufacturerName, 
                 String firmwareVersion, Integer meterType, String meterCategory,
                 String currentRating, Integer yearOfManufacture, Long ctr, Long ptr,
                 LocalDateTime createdAt, LocalDateTime updatedAt, UUID groupId,
                 String status, LocalDateTime lastCommunication, String protocolVersion,
                 String ipAddress, Integer port) {
        this.meterSerialNumber = meterSerialNumber;
        this.deviceId = deviceId;
        this.manufacturerName = manufacturerName;
        this.firmwareVersion = firmwareVersion;
        this.meterType = meterType;
        this.meterCategory = meterCategory;
        this.currentRating = currentRating;
        this.yearOfManufacture = yearOfManufacture;
        this.ctr = ctr;
        this.ptr = ptr;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.groupId = groupId;
        this.status = status;
        this.lastCommunication = lastCommunication;
        this.protocolVersion = protocolVersion;
        this.ipAddress = ipAddress;
        this.port = port;
    }

    // Getters
    public String getMeterSerialNumber() { return meterSerialNumber; }
    public String getDeviceId() { return deviceId; }
    public String getManufacturerName() { return manufacturerName; }
    public String getFirmwareVersion() { return firmwareVersion; }
    public Integer getMeterType() { return meterType; }
    public String getMeterCategory() { return meterCategory; }
    public String getCurrentRating() { return currentRating; }
    public Integer getYearOfManufacture() { return yearOfManufacture; }
    public Long getCtr() { return ctr; }
    public Long getPtr() { return ptr; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public UUID getGroupId() { return groupId; }
    public String getStatus() { return status; }
    public LocalDateTime getLastCommunication() { return lastCommunication; }
    public String getProtocolVersion() { return protocolVersion; }
    public String getIpAddress() { return ipAddress; }
    public Integer getPort() { return port; }

    // Setters
    public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public void setManufacturerName(String manufacturerName) { this.manufacturerName = manufacturerName; }
    public void setFirmwareVersion(String firmwareVersion) { this.firmwareVersion = firmwareVersion; }
    public void setMeterType(Integer meterType) { this.meterType = meterType; }
    public void setMeterCategory(String meterCategory) { this.meterCategory = meterCategory; }
    public void setCurrentRating(String currentRating) { this.currentRating = currentRating; }
    public void setYearOfManufacture(Integer yearOfManufacture) { this.yearOfManufacture = yearOfManufacture; }
    public void setCtr(Long ctr) { this.ctr = ctr; }
    public void setPtr(Long ptr) { this.ptr = ptr; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public void setStatus(String status) { this.status = status; }
    public void setLastCommunication(LocalDateTime lastCommunication) { this.lastCommunication = lastCommunication; }
    public void setProtocolVersion(String protocolVersion) { this.protocolVersion = protocolVersion; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public void setPort(Integer port) { this.port = port; }

    // Compatibility methods for existing code
    public String getSerialNumber() { return meterSerialNumber; }
    public void setSerialNumber(String serialNumber) { this.meterSerialNumber = serialNumber; }
    
    public String getManufacturer() { return manufacturerName; }
    public void setManufacturer(String manufacturer) { this.manufacturerName = manufacturer; }
    
    public String getModel() { return deviceId; } // Using device_id as model
    public void setModel(String model) { this.deviceId = model; }
    
    public boolean isActive() { return "CONNECTED".equals(status); }
    public void setActive(boolean active) { this.status = active ? "CONNECTED" : "DISCONNECTED"; }
    
    public Instant getLastConnectedAt() { 
        return lastCommunication != null ? lastCommunication.toInstant(java.time.ZoneOffset.UTC) : null; 
    }
    public void setLastConnectedAt(Instant lastConnectedAt) { 
        this.lastCommunication = lastConnectedAt != null ? 
            LocalDateTime.ofInstant(lastConnectedAt, java.time.ZoneOffset.UTC) : null; 
    }
    
    public Instant getLastPing() { return getLastConnectedAt(); }
    public void setLastPing(Instant lastPing) { setLastConnectedAt(lastPing); }
    
    public Instant getLastRelayOperation() { return getLastConnectedAt(); }
    public void setLastRelayOperation(Instant lastRelayOperation) { setLastConnectedAt(lastRelayOperation); }
} 