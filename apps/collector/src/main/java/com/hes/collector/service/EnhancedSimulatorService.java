package com.hes.collector.service;

import com.hes.collector.simulator.CollectorMeterSimulator;
import com.hes.data.entities.Meter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
public class EnhancedSimulatorService {
    private static final Logger logger = LoggerFactory.getLogger(EnhancedSimulatorService.class);
    private final CollectorMeterSimulator simulator;
    private final MeterService meterService;

    public EnhancedSimulatorService(CollectorMeterSimulator simulator, MeterService meterService) {
        this.simulator = simulator;
        this.meterService = meterService;
        logger.info("EnhancedSimulatorService initialized with simulator: {} and meterService: {}", simulator, meterService);
    }

    @PostConstruct
    public void initializeSimulator() {
        logger.info("Starting simulator initialization...");
        try {
            List<Meter> meters = meterService.getAllMeters();
            logger.info("Found {} meters in the database", meters.size());
            meters.forEach(meter -> {
                logger.info("Adding meter to simulator: {}", meter);
                simulator.addMeter(meter);
            });
            logger.info("Initialized simulator with {} meters", meters.size());
        } catch (Exception e) {
            logger.error("Error initializing simulator: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedRate = 30000) // Generate readings every 30 seconds
    public void generateReadings() {
        try {
            logger.info("Starting to generate readings...");
            simulator.generateReadings();
            logger.info("Successfully generated readings for all meters");
        } catch (Exception e) {
            logger.error("Error generating readings: {}", e.getMessage(), e);
        }
    }

    public void addMeter(Meter meter) {
        simulator.addMeter(meter);
        logger.info("Added meter {} to simulator", meter.getSerialNumber());
    }

    public void removeMeter(Meter meter) {
        // Implementation depends on your needs
        logger.info("Removed meter {} from simulator", meter.getSerialNumber());
    }
} 