package com.hes.data.entities;

import com.hes.common.entity.MeterGroup;
import com.hes.common.entity.MeterStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "meters")
@EqualsAndHashCode(callSuper = true)
public class Meter extends BaseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "meter_id")
    private UUID id;

    @Column(name = "meter_code", nullable = false, unique = true)
    private String meterCode;

    @Column(name = "serial_number", nullable = false, unique = true)
    private String serialNumber;

    @Column(name = "manufacturer", nullable = false)
    private String manufacturer;

    @Column(name = "model", nullable = false)
    private String model;

    @Column(name = "meter_type", nullable = false)
    private String meterType;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "firmware_version")
    private String firmwareVersion;

    @Column(name = "installation_date", nullable = false)
    private Instant installationDate;

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