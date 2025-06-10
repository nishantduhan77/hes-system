package com.hes.data.entities.profiles;

import com.hes.data.entities.BaseEntity;
import com.hes.data.entities.Meter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "block_load_profiles")
public class BlockLoadProfile extends BaseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", nullable = false)
    private Meter meter;

    @Column(name = "capture_time", nullable = false)
    private Instant captureTime;

    @Column(name = "buffer_size", nullable = false)
    private Integer bufferSize;

    @Column(name = "capture_objects_count", nullable = false)
    private Integer captureObjectsCount;

    @Column(name = "capture_period", nullable = false)
    private Long capturePeriod;

    @Column(name = "sort_method", nullable = false)
    private Integer sortMethod = 1; // FIFO

    @Column(name = "sort_object")
    private Integer sortObject;

    @Column(name = "entries_in_use")
    private Long entriesInUse;

    @Column(name = "profile_entries")
    private Long profileEntries;

    @Column(name = "obis_code", nullable = false)
    private String obisCode = "1.0.99.1.0.255";

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BlockLoadCapture> captures;
} 