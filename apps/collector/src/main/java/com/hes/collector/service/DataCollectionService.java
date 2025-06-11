package com.hes.collector.service;

import com.hes.collector.simulator.CollectorMeterSimulator;
import com.hes.data.entities.Meter;
import com.hes.data.entities.MeterReading;
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
            List<MeterReading> readings = meterSimulator.generateReadings();
            log.info("Collected {} readings", readings.size());
            
            // Send readings to Kafka
            for (MeterReading reading : readings) {
                try {
                    String key = reading.getId() != null ? reading.getId().toString() : "unknown";
                    kafkaTemplate.send(TOPIC, key, reading);
                    log.debug("Sent reading for meter {} with type {}", 
                        key, reading.getReadingType());
                } catch (Exception e) {
                    log.error("Failed to send reading to Kafka: {}", e.getMessage());
                }
            }
            
            log.info("Successfully processed all readings");
            return readings;
        } catch (Exception e) {
            log.error("Error collecting readings: {}", e.getMessage());
            throw e;
        }
    }
} 