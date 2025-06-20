package com.hes.collector.service;

import com.hes.collector.config.DlmsConfig;
import com.hes.collector.dlms.*;
import com.hes.collector.dlms.security.SecuritySuite;
import com.hes.collector.model.MeterTransaction;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class MeterCommunicationService {
    private final DlmsConfig config;
    private final Timer communicationTimer;
    private final Timer successTimer;
    private final Timer failureTimer;

    public MeterCommunicationService(DlmsConfig config, MeterRegistry registry) {
        this.config = config;
        this.communicationTimer = Timer.builder("meter.communication.duration")
            .description("Time taken for meter communication")
            .register(registry);
        this.successTimer = Timer.builder("meter.communication.success")
            .description("Successful meter communications")
            .register(registry);
        this.failureTimer = Timer.builder("meter.communication.failure")
            .description("Failed meter communications")
            .register(registry);
    }

    @CircuitBreaker(name = "meterCommunication")
    @Retry(name = "meterCommunication")
    public CompletableFuture<MeterTransaction.Result> communicate(
            String ipAddress,
            int port,
            CosemObject object,
            DataObject value,
            boolean isWrite) {
        
        return CompletableFuture.supplyAsync(() -> {
            Instant start = Instant.now();
            MeterTransaction.Result result = new MeterTransaction.Result();
            
            try (DlmsProtocol protocol = createProtocol(ipAddress, port)) {
                // Establish connection
                if (!protocol.connect()) {
                    result.setSuccess(false);
                    result.setError("Failed to connect to meter");
                    recordFailure(start);
                    return result;
                }

                // Perform operation
                if (isWrite) {
                    DlmsProtocol.SetResult setResult = protocol.set(object, value);
                    result.setSuccess(setResult.isSuccess());
                    result.setError(setResult.getError());
                } else {
                    DlmsProtocol.GetResult getResult = protocol.get(object);
                    result.setSuccess(getResult.isSuccess());
                    result.setError(getResult.getError());
                    result.setValue(getResult.getValue());
                }

                // Record metrics
                if (result.isSuccess()) {
                    recordSuccess(start);
                } else {
                    recordFailure(start);
                }

                return result;
            } catch (Exception e) {
                log.error("Error during meter communication: {}", e.getMessage());
                result.setSuccess(false);
                result.setError(e.getMessage());
                recordFailure(start);
                return result;
            }
        });
    }

    private DlmsProtocol createProtocol(String ipAddress, int port) {
        SecuritySuite security;
        if (config.isUseHighLevelSecurity()) {
            security = SecuritySuite.highLevelSecurity(
                hexStringToByteArray(config.getAuthenticationKey()),
                hexStringToByteArray(config.getEncryptionKey()),
                hexStringToByteArray(config.getSystemTitle())
            );
        } else {
            security = SecuritySuite.lowLevelSecurity(
                hexStringToByteArray(config.getAuthenticationKey())
            );
        }

        return DlmsProtocol.builder()
            .ipAddress(ipAddress)
            .port(port)
            .config(config)
            .security(security)
            .build();
    }

    private void recordSuccess(Instant start) {
        Duration duration = Duration.between(start, Instant.now());
        communicationTimer.record(duration.toMillis(), TimeUnit.MILLISECONDS);
        successTimer.record(1, TimeUnit.SECONDS);
    }

    private void recordFailure(Instant start) {
        Duration duration = Duration.between(start, Instant.now());
        communicationTimer.record(duration.toMillis(), TimeUnit.MILLISECONDS);
        failureTimer.record(1, TimeUnit.SECONDS);
    }

    private static byte[] hexStringToByteArray(String s) {
        if (s == null) {
            return new byte[0];
        }
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i + 1), 16));
        }
        return data;
    }
} 