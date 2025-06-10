package com.hes.data.entities.eswf;

import com.hes.data.entities.BaseEntity;
import com.hes.data.entities.Meter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "eswf_configurations")
public class EswfConfiguration extends BaseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", nullable = false)
    private Meter meter;

    @Column(name = "byte_number", nullable = false)
    private Integer byteNumber;

    @Column(name = "bit_number", nullable = false)
    private Integer bitNumber;

    @Column(name = "description")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Version
    private Long version;
} 