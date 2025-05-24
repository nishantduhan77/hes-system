package com.hes.collector.service;

import com.hes.collector.simulator.MeterSimulator;
import com.hes.common.entity.Meter;
import com.hes.common.entity.MeterReading;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataCollectionService {
    private final MeterSimulator meterSimulator;
    private final KafkaTemplate<String, MeterReading> kafkaTemplate;
    private static final String TOPIC = "meter-readings";

    public void registerMeter(Meter meter) {
        meterSimulator.addMeter(meter);
        log.info("Registered meter for data collection: {}", meter.getSerialNumber());
    }

    @Scheduled(fixedRate = 30 * 60 * 1000) // Run every 30 minutes
    public void collectAndPublishReadings() {
        log.info("Starting scheduled data collection");
        try {
            List<MeterReading> readings = meterSimulator.generateReadings();
            publishReadings(readings);
            log.info("Successfully collected and published {} readings", readings.size());
        } catch (Exception e) {
            log.error("Error during data collection", e);
        }
    }

    private void publishReadings(List<MeterReading> readings) {
        for (MeterReading reading : readings) {
            String key = reading.getMeterId().toString() + "_" + reading.getReadingType();
            kafkaTemplate.send(TOPIC, key, reading)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish reading: {}", key, ex);
                    } else {
                        log.debug("Successfully published reading: {}", key);
                    }
                });
        }
    }
} 