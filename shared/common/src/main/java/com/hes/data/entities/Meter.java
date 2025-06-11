package com.hes.data.entities;

import com.hes.common.entity.MeterGroup;
import com.hes.common.entity.MeterStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;

@Data
@Entity(name = "DataMeter")
@Table(name = "meters")
@EqualsAndHashCode(callSuper = true)
public class Meter extends BaseEntity {
    @Id
    @Column(name = "meter_serial_number")
    private String serialNumber;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "manufacturer_name", nullable = false)
    private String manufacturer;

    @Column(name = "firmware_version")
    private String firmwareVersion;

    @Column(name = "meter_type", nullable = false)
    private Integer meterType;

    @Column(name = "meter_category", nullable = false)
    private String meterCategory;

    @Column(name = "current_rating")
    private String currentRating;

    @Column(name = "year_of_manufacture")
    private Integer yearOfManufacture;

    @Column(name = "ctr")
    private Long ctr;

    @Column(name = "ptr")
    private Long ptr;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private MeterStatus status;

    @Column(name = "last_communication")
    private Instant lastCommunication;

    @Column(name = "protocol_version")
    private String protocolVersion;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "port")
    private Integer port;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private MeterGroup group;
} 