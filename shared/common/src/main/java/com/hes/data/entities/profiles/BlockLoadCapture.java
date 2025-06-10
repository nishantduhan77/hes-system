package com.hes.data.entities.profiles;

import com.hes.data.entities.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "block_load_captures")
public class BlockLoadCapture extends BaseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private BlockLoadProfile profile;

    @Column(name = "capture_time", nullable = false)
    private Instant captureTime;

    @Column(name = "rtc_time")
    private String rtcTime;

    // Current measurements
    @Column(name = "current_ir")
    private Double currentIr;

    @Column(name = "current_iy")
    private Double currentIy;

    @Column(name = "current_ib")
    private Double currentIb;

    // Voltage measurements
    @Column(name = "voltage_vrn")
    private Double voltageVrn;

    @Column(name = "voltage_vyn")
    private Double voltageVyn;

    @Column(name = "voltage_vbn")
    private Double voltageBn;

    // Block Energy measurements
    @Column(name = "block_energy_wh_import")
    private Double blockEnergyWhImport;

    @Column(name = "block_energy_wh_export")
    private Double blockEnergyWhExport;

    @Column(name = "block_energy_vah_q1")
    private Double blockEnergyVahQ1;

    @Column(name = "block_energy_vah_q2")
    private Double blockEnergyVahQ2;

    @Column(name = "block_energy_vah_q3")
    private Double blockEnergyVahQ3;

    @Column(name = "block_energy_vah_q4")
    private Double blockEnergyVahQ4;

    @Column(name = "block_energy_vah_import")
    private Double blockEnergyVahImport;

    @Column(name = "block_energy_vah_export")
    private Double blockEnergyVahExport;

    // Health and Signal
    @Column(name = "meter_health_indicator")
    private Integer meterHealthIndicator;

    @Column(name = "signal_strength")
    private Integer signalStrength;
} 