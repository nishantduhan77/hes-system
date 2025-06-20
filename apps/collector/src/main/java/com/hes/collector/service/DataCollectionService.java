package com.hes.collector.service;

import com.hes.collector.simulator.CollectorMeterSimulator;
import com.hes.collector.model.Meter;
import com.hes.collector.model.MeterReading;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class DataCollectionService {
    private final CollectorMeterSimulator meterSimulator;
    private final KafkaTemplate<String, MeterReading> kafkaTemplate;
    private static final String TOPIC = "meter-readings";

    public DataCollectionService(CollectorMeterSimulator meterSimulator, KafkaTemplate<String, MeterReading> kafkaTemplate) {
        this.meterSimulator = meterSimulator;
        this.kafkaTemplate = kafkaTemplate;
    }

    public void addMeter(Meter meter) {
        log.info("Adding meter to simulator: {}", meter.getSerialNumber());
        meterSimulator.addMeter(meter);
    }

    public List<MeterReading> collectReadings() {
        log.info("Starting to collect readings from simulator");
        try {
            meterSimulator.generateReadings();
            log.info("Generated readings from simulator");
            
            // For now, return empty list since generateReadings doesn't return data
            // In a real implementation, you would get the readings from a repository or cache
            List<MeterReading> readings = java.util.Collections.emptyList();
            log.info("Collected {} readings", readings.size());
            
            log.info("Successfully processed all readings");
            return readings;
        } catch (Exception e) {
            log.error("Error collecting readings: {}", e.getMessage());
            throw e;
        }
    }
} 