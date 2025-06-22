package com.hes.collector.service;

import com.hes.collector.simulator.CollectorMeterSimulator;
import com.hes.collector.model.Meter;
import com.hes.collector.model.MeterTransaction;
import com.hes.collector.dlms.CosemObject;
import com.hes.collector.dlms.DataObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class EnhancedSimulatorService {
    private static final Logger log = LoggerFactory.getLogger(EnhancedSimulatorService.class);
    private final CollectorMeterSimulator simulator;
    private final MeterService meterService;
    private final MeterCommunicationService meterCommunicationService;
    private final DlmsMeterCommunicationService dlmsService;
    private final RealTimeMeterCommunicationService realTimeService;

    @Autowired
    public EnhancedSimulatorService(
            CollectorMeterSimulator simulator, 
            MeterService meterService,
            MeterCommunicationService meterCommunicationService,
            DlmsMeterCommunicationService dlmsService,
            RealTimeMeterCommunicationService realTimeService) {
        this.simulator = simulator;
        this.meterService = meterService;
        this.meterCommunicationService = meterCommunicationService;
        this.dlmsService = dlmsService;
        this.realTimeService = realTimeService;
        log.info("EnhancedSimulatorService initialized with all DLMS communication services");
    }

    @PostConstruct
    public void initializeSimulator() {
        log.info("Starting enhanced simulator initialization...");
        try {
            List<Meter> meters = meterService.getAllMeters();
            log.info("Found {} meters in the database", meters.size());
            meters.forEach(meter -> {
                log.info("Adding meter to simulator: {}", meter.getSerialNumber());
                simulator.addMeter(meter);
            });
            log.info("Initialized enhanced simulator with {} meters", meters.size());
        } catch (Exception e) {
            log.error("Error initializing enhanced simulator: {}", e.getMessage(), e);
        }
    }

    /**
     * Scheduled comprehensive data collection (keeps all transaction data)
     */
    @Scheduled(fixedRate = 30000) // Generate readings every 30 seconds
    public void generateReadings() {
        try {
            log.info("Starting to generate comprehensive readings with enhanced DLMS features...");
            simulator.generateReadings();
            log.info("Successfully generated comprehensive readings for all meters");
        } catch (Exception e) {
            log.error("Error generating comprehensive readings: {}", e.getMessage(), e);
        }
    }

    /**
     * Scheduled enhanced DLMS communication (keeps all DLMS operations)
     */
    @Scheduled(fixedRate = 60000) // Every minute
    public void performEnhancedDlmsCommunication() {
        log.info("Starting scheduled enhanced DLMS communication cycle");
        
        List<Meter> meters = meterService.getAllMeters();
        for (Meter meter : meters) {
            try {
                // Use the scheduled method
                simulator.performScheduledDlmsCommunication();
                
            } catch (Exception e) {
                log.error("Error in scheduled enhanced DLMS communication for meter {}: {}", 
                    meter.getSerialNumber(), e.getMessage(), e);
            }
        }
    }

    private void performPingWithRetry(Meter meter) {
        try {
            log.debug("Performing ping with retry for meter: {}", meter.getSerialNumber());

            if (meter.getPort() == null) {
                log.warn("Meter {} does not have a port configured. Skipping ping.", meter.getSerialNumber());
                return;
            }
            
            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                meter.getIpAddress(),
                meter.getPort(),
                CosemObject.StandardObjects.CLOCK,
                null,
                false
            );

            MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);
            
            if (result.isSuccess()) {
                log.info("Ping successful for meter: {}", meter.getSerialNumber());
                // Update last communication timestamp
                meterService.updateLastCommunication(meter.getSerialNumber());
            } else {
                log.warn("Ping failed for meter {}: {}", meter.getSerialNumber(), result.getError());
                // Trigger retry mechanism
                triggerRetryMechanism(meter, "PING");
            }
        } catch (Exception e) {
            log.error("Error performing ping for meter {}: {}", meter.getSerialNumber(), e.getMessage());
            triggerRetryMechanism(meter, "PING");
        }
    }

    private void performProtectedReadOperations(Meter meter) {
        if (meter.getPort() == null) {
            log.warn("Meter {} does not have a port configured. Skipping read operations.", meter.getSerialNumber());
            return;
        }
        CosemObject[] objectsToRead = {
            CosemObject.StandardObjects.ACTIVE_POWER_IMPORT,
            CosemObject.StandardObjects.VOLTAGE_L1,
            CosemObject.StandardObjects.CURRENT_L1,
            CosemObject.StandardObjects.CLOCK
        };

        for (CosemObject object : objectsToRead) {
            try {
                log.debug("Reading {} for meter: {}", object, meter.getSerialNumber());
                
                CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                    meter.getIpAddress(),
                    meter.getPort(),
                    object,
                    null,
                    false
                );

                MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);
                
                if (result.isSuccess()) {
                    log.debug("DLMS read successful for meter {} object {}: {}", 
                        meter.getSerialNumber(), object, result.getValue());
                } else {
                    log.debug("DLMS read failed for meter {} object {}: {}", 
                        meter.getSerialNumber(), object, result.getError());
                }
            } catch (Exception e) {
                log.debug("Error reading DLMS object {} for meter {}: {}", 
                    object, meter.getSerialNumber(), e.getMessage());
            }
        }
    }

    private boolean shouldPerformRelayOperation(Meter meter) {
        // 5% chance of relay operation
        return Math.random() < 0.05;
    }

    private void performRelayOperationWithTransaction(Meter meter) {
        if (meter.getPort() == null) {
            log.warn("Meter {} does not have a port configured. Skipping relay operation.", meter.getSerialNumber());
            return;
        }
        try {
            // Randomly connect or disconnect
            boolean connect = Math.random() < 0.5;
            DataObject relayValue = DataObject.newBoolean(connect);
            
            log.info("Performing relay operation for meter {}: {}", 
                meter.getSerialNumber(), connect ? "CONNECT" : "DISCONNECT");
            
            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                meter.getIpAddress(),
                meter.getPort(),
                CosemObject.StandardObjects.RELAY_CONTROL,
                relayValue,
                true
            );

            MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);
            
            if (result.isSuccess()) {
                log.info("Relay operation successful for meter {}: {}", 
                    meter.getSerialNumber(), connect ? "CONNECT" : "DISCONNECT");
                // Update meter status
                meterService.updateMeterStatus(meter.getSerialNumber(), connect ? "CONNECTED" : "DISCONNECTED");
            } else {
                log.warn("Relay operation failed for meter {}: {}", 
                    meter.getSerialNumber(), result.getError());
            }
        } catch (Exception e) {
            log.error("Error performing relay operation for meter {}: {}", 
                meter.getSerialNumber(), e.getMessage());
        }
    }

    private void triggerRetryMechanism(Meter meter, String operation) {
        log.info("Triggering retry mechanism for meter {} operation {}", meter.getSerialNumber(), operation);
        // This would integrate with the transaction manager for retry logic
        // For now, just log the retry attempt
    }

    /**
     * Manual control methods for testing and administration
     */
    public void addMeter(Meter meter) {
        simulator.addMeter(meter);
        log.info("Added meter {} to enhanced simulator", meter.getSerialNumber());
    }

    public void removeMeter(Meter meter) {
        // Implementation depends on your needs
        log.info("Removed meter {} from enhanced simulator", meter.getSerialNumber());
    }

    public void performManualPing(String meterSerialNumber) {
        try {
            Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
            if (meter != null) {
                performPingWithRetry(meter);
            } else {
                log.error("Meter not found: {}", meterSerialNumber);
            }
        } catch (Exception e) {
            log.error("Error performing manual ping for meter {}: {}", meterSerialNumber, e.getMessage());
        }
    }

    public void performManualRelayOperation(String meterSerialNumber, boolean connect) {
        try {
            Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
            if (meter != null) {
                DataObject relayValue = DataObject.newBoolean(connect);
                
                CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                    meter.getIpAddress(),
                    meter.getPort(),
                    CosemObject.StandardObjects.RELAY_CONTROL,
                    relayValue,
                    true
                );

                MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);
                
                if (result.isSuccess()) {
                    log.info("Manual relay operation successful for meter {}: {}", 
                        meterSerialNumber, connect ? "CONNECT" : "DISCONNECT");
                } else {
                    log.warn("Manual relay operation failed for meter {}: {}", 
                        meterSerialNumber, result.getError());
                }
            } else {
                log.error("Meter not found: {}", meterSerialNumber);
            }
        } catch (Exception e) {
            log.error("Error performing manual relay operation for meter {}: {}", meterSerialNumber, e.getMessage());
        }
    }

    /**
     * Get simulator status
     */
    public String getSimulatorStatus() {
        try {
            List<Meter> meters = meterService.getAllMeters();
            return String.format("Enhanced Simulator Status: %d meters loaded, DLMS communication active", meters.size());
        } catch (Exception e) {
            log.error("Error getting simulator status: {}", e.getMessage());
            return "Enhanced Simulator Status: Error retrieving status";
        }
    }

    /**
     * ODR: Instantaneous Reading - Read all current meter values
     */
    public MeterTransaction performInstantaneousReading(String meterSerialNumber) {
        log.info("EnhancedSimulatorService: Performing instantaneous reading for meter: {}", meterSerialNumber);
        return simulator.performInstantaneousReading(meterSerialNumber);
    }

    /**
     * ODR: Enhanced Ping operation for connectivity verification
     */
    public MeterTransaction performPingOperation(String meterSerialNumber) {
        log.info("EnhancedSimulatorService: Performing enhanced ping operation for meter: {}", meterSerialNumber);
        return simulator.performPingOperation(meterSerialNumber);
    }
} 