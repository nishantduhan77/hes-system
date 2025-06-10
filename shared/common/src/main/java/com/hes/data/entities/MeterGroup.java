package com.hes.data.entities;

import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import java.util.UUID;

@Data
@Entity
@Table(name = "meter_groups")
@EqualsAndHashCode(callSuper = true)
public class MeterGroup extends BaseEntity {
    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;
} 