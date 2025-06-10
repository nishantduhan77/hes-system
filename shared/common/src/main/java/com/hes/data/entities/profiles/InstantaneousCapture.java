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
@Table(name = "instantaneous_captures")
public class InstantaneousCapture extends BaseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private InstantaneousProfile profile;

    @Column(name = "capture_time", nullable = false)
    private Instant captureTime;

    @Column(name = "rtc_time")
    private String rtcTime;

    // Current measurements
    @Column(name = "l1_current_ir")
    private Double l1CurrentIr;

    @Column(name = "l2_current_iy")
    private Double l2CurrentIy;

    @Column(name = "l3_current_ib")
    private Double l3CurrentIb;

    // Voltage measurements
    @Column(name = "l1_voltage_vrn")
    private Double l1VoltageVrn;

    @Column(name = "l2_voltage_vyn")
    private Double l2VoltageVyn;

    @Column(name = "l3_voltage_vbn")
    private Double l3VoltageBn;

    // Power factor measurements
    @Column(name = "l1_power_factor")
    private Double l1PowerFactor;

    @Column(name = "l2_power_factor")
    private Double l2PowerFactor;

    @Column(name = "l3_power_factor")
    private Double l3PowerFactor;

    @Column(name = "three_phase_power_factor")
    private Double threePhasePoserFactor;

    @Column(name = "frequency")
    private Double frequency;

    @Column(name = "apparent_power_va")
    private Double apparentPowerVa;

    @Column(name = "active_power_w")
    private Double activePowerW;

    @Column(name = "reactive_power_var")
    private Double reactivePowerVar;

    // Additional parameters
    @Column(name = "power_failures")
    private Long powerFailures;

    @Column(name = "power_off_duration_minutes")
    private Long powerOffDurationMinutes;

    @Column(name = "tamper_count")
    private Long tamperCount;

    @Column(name = "billing_count")
    private Long billingCount;

    @Column(name = "programming_count")
    private Long programmingCount;

    @Column(name = "last_billing_date")
    private String lastBillingDate;

    // Energy measurements
    @Column(name = "cum_energy_wh_import")
    private Double cumEnergyWhImport;

    @Column(name = "cum_energy_wh_export")
    private Double cumEnergyWhExport;

    @Column(name = "cum_energy_vah_q1")
    private Double cumEnergyVahQ1;

    @Column(name = "cum_energy_vah_q2")
    private Double cumEnergyVahQ2;

    @Column(name = "cum_energy_vah_q3")
    private Double cumEnergyVahQ3;

    @Column(name = "cum_energy_vah_q4")
    private Double cumEnergyVahQ4;

    @Column(name = "cum_energy_vah_import")
    private Double cumEnergyVahImport;

    @Column(name = "cum_energy_vah_export")
    private Double cumEnergyVahExport;

    // Maximum demand measurements
    @Column(name = "max_demand_active_import_w")
    private Double maxDemandActiveImportW;

    @Column(name = "max_demand_active_datetime")
    private String maxDemandActiveDateTime;

    @Column(name = "max_demand_apparent_import_va")
    private Double maxDemandApparentImportVa;

    @Column(name = "max_demand_apparent_datetime")
    private String maxDemandApparentDateTime;
} 