package com.hes.common.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "meters")
@EqualsAndHashCode(of = "id")
public class Meter {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "serial_number", nullable = false, unique = true)
    private String serialNumber;

    @Column(nullable = false)
    private String manufacturer;

    @Column(nullable = false)
    private String model;

    @Column(name = "firmware_version")
    private String firmwareVersion;

    @Column(name = "protocol_version")
    private String protocolVersion;

    @Column(name = "ip_address")
    private String ipAddress;

    private Integer port;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private MeterGroup group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MeterStatus status = MeterStatus.DISCONNECTED;

    @Column(name = "last_connected_at")
    private Instant lastConnectedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum MeterStatus {
        CONNECTED,
        DISCONNECTED,
        ERROR,
        MAINTENANCE
    }
} 