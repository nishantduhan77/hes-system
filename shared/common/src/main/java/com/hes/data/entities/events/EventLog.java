package com.hes.data.entities.events;

import com.hes.data.entities.BaseEntity;
import com.hes.data.entities.Meter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Entity
@Table(name = "event_logs")
@EqualsAndHashCode(callSuper = true)
public class EventLog extends BaseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", nullable = false)
    private Meter meter;

    @Column(name = "event_time", nullable = false)
    private Instant eventTime;

    @Column(name = "event_code", nullable = false)
    private Integer eventCode;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "obis_code", nullable = false)
    private String obisCode;

    @Column(name = "event_sequence_number")
    private Long eventSequenceNumber;

    @Column(name = "rtc_time")
    private String rtcTime;

    // Electrical parameters at event time
    @Column(name = "current_ir")
    private Double currentIr;

    @Column(name = "current_iy")
    private Double currentIy;

    @Column(name = "current_ib")
    private Double currentIb;

    @Column(name = "voltage_vrn")
    private Double voltageVrn;

    @Column(name = "voltage_vyn")
    private Double voltageVyn;

    @Column(name = "voltage_vbn")
    private Double voltageBn;

    @Column(name = "power_factor_r")
    private Double powerFactorR;

    @Column(name = "power_factor_y")
    private Double powerFactorY;

    @Column(name = "power_factor_b")
    private Double powerFactorB;

    @Column(name = "cum_energy_wh_import")
    private Double cumEnergyWhImport;

    @Column(name = "cum_energy_wh_export")
    private Double cumEnergyWhExport;

    @Column(name = "additional_info", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> additionalInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private EventCategory category;

    @Column(name = "description")
    private String description;

    @Column(name = "severity", nullable = false)
    @Enumerated(EnumType.STRING)
    private EventSeverity severity;

    @Column(name = "source")
    private String source;

    @Column(name = "acknowledged")
    private Boolean acknowledged = false;

    @Column(name = "acknowledgement_time")
    private Instant acknowledgementTime;

    @Column(name = "acknowledged_by")
    private String acknowledgedBy;

    @Column(name = "resolution_status")
    @Enumerated(EnumType.STRING)
    private ResolutionStatus resolutionStatus = ResolutionStatus.OPEN;

    @Column(name = "resolution_time")
    private Instant resolutionTime;

    @Column(name = "resolved_by")
    private String resolvedBy;

    @Column(name = "resolution_notes")
    private String resolutionNotes;

    @Column(name = "metadata")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;
} 