package com.hes.common.repository;

import com.hes.common.entity.MeterGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MeterGroupRepository extends JpaRepository<MeterGroup, UUID> {
} 