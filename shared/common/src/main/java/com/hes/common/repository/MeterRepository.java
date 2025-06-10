package com.hes.common.repository;

import com.hes.data.entities.Meter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MeterRepository extends JpaRepository<Meter, UUID> {
} 