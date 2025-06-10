package com.hes.data.entities.events;

import com.hes.data.entities.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "event_categories")
public class EventCategory extends BaseEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @Column(name = "obis_code", nullable = false)
    private String obisCode;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "category")
    private List<EventLog> events;
} 