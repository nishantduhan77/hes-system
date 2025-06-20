package com.hes.collector.repository;

import com.hes.collector.model.Meter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollectorMeterRepository extends JpaRepository<Meter, String> {
    List<Meter> findByStatus(String status);
    Optional<Meter> findByMeterSerialNumber(String meterSerialNumber);
    List<Meter> findByIpAddress(String ipAddress);
} 