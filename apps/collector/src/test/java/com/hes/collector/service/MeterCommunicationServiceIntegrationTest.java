package com.hes.collector.service;

import com.hes.collector.config.DlmsConfig;
import com.hes.collector.dlms.CosemObject;
import com.hes.collector.dlms.DataObject;
import com.hes.collector.model.MeterTransaction;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.test.context.TestPropertySource;
import static org.junit.jupiter.api.Assertions.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@DisplayName("Meter Communication Service Integration Tests")
@TestPropertySource(properties = {
    "spring.profiles.active=test"
})
class MeterCommunicationServiceIntegrationTest {

    private MeterCommunicationService service;
    private DlmsConfig config;
    private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        config = new DlmsConfig();
        config.setReadTimeoutMs(1000);
        config.setConnectTimeoutMs(2000);
        config.setMaxRetries(2);
        config.setUseHdlc(false);
        config.setClientId(1);
        config.setServerLowerMacAddress(17);
        config.setAuthenticationKey("41424344454647484950515253545556");
        config.setEncryptionKey("41424344454647484950515253545556");
        config.setSystemTitle("4D4D4D0000000001");
        config.setUseHighLevelSecurity(false);
        
        meterRegistry = new SimpleMeterRegistry();
        service = new MeterCommunicationService(config, meterRegistry);
    }

    @Test
    @DisplayName("Should handle connection timeout gracefully")
    void shouldHandleConnectionTimeoutGracefully() throws Exception {
        // Try to connect to a non-existent meter
        CompletableFuture<MeterTransaction.Result> future = service.communicate(
            "192.168.1.999", // Non-existent IP
            4059,
            CosemObject.StandardObjects.CLOCK,
            null,
            false
        );

        MeterTransaction.Result result = future.get(5, TimeUnit.SECONDS);
        
        assertFalse(result.isSuccess());
        assertNotNull(result.getError());
        assertTrue(result.getError().contains("Failed to connect") || 
                  result.getError().contains("timeout"));
    }

    @Test
    @DisplayName("Should handle invalid meter address gracefully")
    void shouldHandleInvalidMeterAddressGracefully() throws Exception {
        CompletableFuture<MeterTransaction.Result> future = service.communicate(
            "invalid-ip-address",
            4059,
            CosemObject.StandardObjects.CLOCK,
            null,
            false
        );

        MeterTransaction.Result result = future.get(5, TimeUnit.SECONDS);
        
        assertFalse(result.isSuccess());
        assertNotNull(result.getError());
    }

    @Test
    @DisplayName("Should handle null COSEM object gracefully")
    void shouldHandleNullCosemObjectGracefully() throws Exception {
        CompletableFuture<MeterTransaction.Result> future = service.communicate(
            "192.168.1.100",
            4059,
            null,
            null,
            false
        );

        MeterTransaction.Result result = future.get(5, TimeUnit.SECONDS);
        
        assertFalse(result.isSuccess());
        assertNotNull(result.getError());
    }

    @Test
    @DisplayName("Should handle read operation with standard objects")
    void shouldHandleReadOperationWithStandardObjects() throws Exception {
        // Test with different standard objects
        CosemObject[] objects = {
            CosemObject.StandardObjects.CLOCK,
            CosemObject.StandardObjects.ACTIVE_POWER_IMPORT,
            CosemObject.StandardObjects.VOLTAGE_L1,
            CosemObject.StandardObjects.CURRENT_L1
        };

        for (CosemObject object : objects) {
            CompletableFuture<MeterTransaction.Result> future = service.communicate(
                "192.168.1.100",
                4059,
                object,
                null,
                false
            );

            MeterTransaction.Result result = future.get(5, TimeUnit.SECONDS);
            
            // Should fail due to no real meter, but should handle gracefully
            assertFalse(result.isSuccess());
            assertNotNull(result.getError());
        }
    }

    @Test
    @DisplayName("Should handle write operation with valid data")
    void shouldHandleWriteOperationWithValidData() throws Exception {
        DataObject writeValue = DataObject.newBoolean(true);
        
        CompletableFuture<MeterTransaction.Result> future = service.communicate(
            "192.168.1.100",
            4059,
            CosemObject.StandardObjects.RELAY_CONTROL,
            writeValue,
            true
        );

        MeterTransaction.Result result = future.get(5, TimeUnit.SECONDS);
        
        // Should fail due to no real meter, but should handle gracefully
        assertFalse(result.isSuccess());
        assertNotNull(result.getError());
    }

    @Test
    @DisplayName("Should handle multiple concurrent requests")
    void shouldHandleMultipleConcurrentRequests() throws Exception {
        CompletableFuture<MeterTransaction.Result>[] futures = new CompletableFuture[5];
        
        for (int i = 0; i < 5; i++) {
            futures[i] = service.communicate(
                "192.168.1.100",
                4059,
                CosemObject.StandardObjects.CLOCK,
                null,
                false
            );
        }

        // Wait for all to complete
        CompletableFuture.allOf(futures).get(10, TimeUnit.SECONDS);
        
        for (CompletableFuture<MeterTransaction.Result> future : futures) {
            MeterTransaction.Result result = future.get();
            assertFalse(result.isSuccess());
            assertNotNull(result.getError());
        }
    }

    @Test
    @DisplayName("Should record metrics for communication attempts")
    void shouldRecordMetricsForCommunicationAttempts() {
        long initialCount = meterRegistry.get("meter.communication.duration").timer().count();
        
        try {
            service.communicate(
                "192.168.1.100",
                4059,
                CosemObject.StandardObjects.CLOCK,
                null,
                false
            ).get(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Expected to fail
        }
        
        long finalCount = meterRegistry.get("meter.communication.duration").timer().count();
        assertTrue(finalCount > initialCount);
    }

    @Test
    @DisplayName("Should handle different port numbers")
    void shouldHandleDifferentPortNumbers() throws Exception {
        int[] ports = {4059, 4060, 4061, 4062};
        
        for (int port : ports) {
            CompletableFuture<MeterTransaction.Result> future = service.communicate(
                "192.168.1.100",
                port,
                CosemObject.StandardObjects.CLOCK,
                null,
                false
            );

            MeterTransaction.Result result = future.get(5, TimeUnit.SECONDS);
            
            assertFalse(result.isSuccess());
            assertNotNull(result.getError());
        }
    }

    @Test
    @DisplayName("Should handle circuit breaker pattern")
    void shouldHandleCircuitBreakerPattern() throws Exception {
        // Make multiple failed requests to trigger circuit breaker
        for (int i = 0; i < 10; i++) {
            try {
                service.communicate(
                    "192.168.1.999",
                    4059,
                    CosemObject.StandardObjects.CLOCK,
                    null,
                    false
                ).get(2, TimeUnit.SECONDS);
            } catch (Exception e) {
                // Expected to fail
            }
        }
        
        // Circuit breaker should eventually open and fail fast
        CompletableFuture<MeterTransaction.Result> future = service.communicate(
            "192.168.1.999",
            4059,
            CosemObject.StandardObjects.CLOCK,
            null,
            false
        );

        MeterTransaction.Result result = future.get(5, TimeUnit.SECONDS);
        assertFalse(result.isSuccess());
    }
} 