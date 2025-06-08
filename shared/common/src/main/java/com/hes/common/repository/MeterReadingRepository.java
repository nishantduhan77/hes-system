package com.hes.common.repository;

import com.hes.common.entity.MeterReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReading, UUID> {

    @Query(value = """
        SELECT * FROM meter_readings
        WHERE meter_id = :meterId
        AND reading_type = :readingType
        AND timestamp >= :from
        AND timestamp < :to
        ORDER BY timestamp DESC
        """, nativeQuery = true)
    List<MeterReading> findReadings(
        @Param("meterId") UUID meterId,
        @Param("readingType") String readingType,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query(value = """
        SELECT time_bucket('30 minutes', timestamp) AS bucket,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as reading_count
        FROM meter_readings
        WHERE meter_id = :meterId
        AND reading_type = :readingType
        AND timestamp >= :from
        AND timestamp < :to
        GROUP BY bucket
        ORDER BY bucket DESC
        """, nativeQuery = true)
    List<Object[]> findAggregatedReadings(
        @Param("meterId") UUID meterId,
        @Param("readingType") String readingType,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query(value = """
        INSERT INTO meter_readings (meter_id, timestamp, reading_type, value, quality, unit)
        VALUES (:#{#reading.meterId}, :#{#reading.timestamp}, :#{#reading.readingType},
                :#{#reading.value}, :#{#reading.quality}, :#{#reading.unit})
        ON CONFLICT (meter_id, timestamp, reading_type) DO UPDATE
        SET value = :#{#reading.value},
            quality = :#{#reading.quality}
        """, nativeQuery = true)
    void upsertReading(@Param("reading") MeterReading reading);

    @Query(value = """
        SELECT DISTINCT ON (meter_id) *
        FROM meter_readings
        WHERE meter_id IN :meterIds
        AND reading_type = :readingType
        ORDER BY meter_id, timestamp DESC
        """, nativeQuery = true)
    List<MeterReading> findLatestReadings(
        @Param("meterIds") List<UUID> meterIds,
        @Param("readingType") String readingType
    );
} 