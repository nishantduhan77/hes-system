package com.hes.collector.controller;

import com.hes.collector.model.MeterTransaction;
import com.hes.collector.dlms.CosemObject;
import com.hes.collector.dlms.DataObject;
import com.hes.collector.service.EnhancedSimulatorService;
import com.hes.collector.service.MeterCommunicationService;
import com.hes.collector.service.MeterService;
import com.hes.collector.model.Meter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/dlms")
@CrossOrigin(origins = "*")
public class DlmsCommandController {

    private static final Logger log = LoggerFactory.getLogger(DlmsCommandController.class);

    @Value("${meter.communication.mock-enabled:false}")
    private boolean mockEnabled;

    @Autowired
    private EnhancedSimulatorService enhancedSimulatorService;

    @Autowired
    private MeterCommunicationService meterCommunicationService;

    @Autowired
    private MeterService meterService;

    /**
     * Ping a specific meter
     * POST /api/dlms/ping
     */
    @PostMapping("/ping")
    public ResponseEntity<Map<String, Object>> pingMeter(@RequestBody PingRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (mockEnabled) {
            log.info("MOCK MODE: Simulating successful ping for meter: {}", request.getMeterSerialNumber());
            response.put("success", true);
            response.put("meterSerialNumber", request.getMeterSerialNumber());
            response.put("message", "MOCK: Ping successful");
            response.put("value", "PONG");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        }

        try {
            log.info("Manual ping request for meter: {}", request.getMeterSerialNumber());
            
            Meter meter = meterService.getMeterBySerialNumber(request.getMeterSerialNumber());
            if (meter == null) {
                response.put("success", false);
                response.put("error", "Meter not found: " + request.getMeterSerialNumber());
                return ResponseEntity.badRequest().body(response);
            }

            if (meter.getPort() == null) {
                response.put("success", false);
                response.put("error", "Ping operation failed: Meter does not have a port configured.");
                log.error("Ping failed for meter {}: Port is not configured.", request.getMeterSerialNumber());
                return ResponseEntity.badRequest().body(response);
            }

            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                meter.getIpAddress(),
                meter.getPort(),
                CosemObject.StandardObjects.CLOCK,
                null,
                false
            );

            MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);
            
            response.put("success", result.isSuccess());
            response.put("meterSerialNumber", request.getMeterSerialNumber());
            response.put("timestamp", System.currentTimeMillis());
            
            if (result.isSuccess()) {
                response.put("message", "Ping successful");
                response.put("value", result.getValue());
                log.info("Ping successful for meter: {}", request.getMeterSerialNumber());
            } else {
                response.put("error", result.getError());
                log.warn("Ping failed for meter {}: {}", request.getMeterSerialNumber(), result.getError());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during ping operation for meter {}: {}", request.getMeterSerialNumber(), e.getMessage());
            response.put("success", false);
            response.put("error", "Ping operation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Relay operation (Connect/Disconnect)
     * POST /api/dlms/relay
     */
    @PostMapping("/relay")
    public ResponseEntity<Map<String, Object>> relayOperation(@RequestBody RelayRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (mockEnabled) {
            String operation = request.isConnect() ? "CONNECT" : "DISCONNECT";
            log.info("MOCK MODE: Simulating successful relay operation for meter: {} - {}", request.getMeterSerialNumber(), operation);
            response.put("success", true);
            response.put("meterSerialNumber", request.getMeterSerialNumber());
            response.put("operation", operation);
            response.put("message", "MOCK: Relay operation successful");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        }
        
        try {
            log.info("Manual relay operation for meter: {} - {}", 
                request.getMeterSerialNumber(), request.isConnect() ? "CONNECT" : "DISCONNECT");
            
            Meter meter = meterService.getMeterBySerialNumber(request.getMeterSerialNumber());
            if (meter == null) {
                response.put("success", false);
                response.put("error", "Meter not found: " + request.getMeterSerialNumber());
                return ResponseEntity.badRequest().body(response);
            }

            if (meter.getPort() == null) {
                response.put("success", false);
                response.put("error", "Relay operation failed: Meter does not have a port configured.");
                log.error("Relay operation failed for meter {}: Port is not configured.", request.getMeterSerialNumber());
                return ResponseEntity.badRequest().body(response);
            }

            DataObject relayValue = DataObject.newBoolean(request.isConnect());
            
            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                meter.getIpAddress(),
                meter.getPort(),
                CosemObject.StandardObjects.RELAY_CONTROL,
                relayValue,
                true
            );

            MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);
            
            response.put("success", result.isSuccess());
            response.put("meterSerialNumber", request.getMeterSerialNumber());
            response.put("operation", request.isConnect() ? "CONNECT" : "DISCONNECT");
            response.put("timestamp", System.currentTimeMillis());
            
            if (result.isSuccess()) {
                response.put("message", "Relay operation successful");
                log.info("Relay operation successful for meter {}: {}", 
                    request.getMeterSerialNumber(), request.isConnect() ? "CONNECT" : "DISCONNECT");
            } else {
                response.put("error", result.getError());
                log.warn("Relay operation failed for meter {}: {}", request.getMeterSerialNumber(), result.getError());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during relay operation for meter {}: {}", request.getMeterSerialNumber(), e.getMessage());
            response.put("success", false);
            response.put("error", "Relay operation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Read meter data
     * POST /api/dlms/read
     */
    @PostMapping("/read")
    public ResponseEntity<Map<String, Object>> readMeterData(@RequestBody ReadRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("Manual read operation for meter: {} - {}", 
                request.getMeterSerialNumber(), request.getCosemObject());
            
            Meter meter = meterService.getMeterBySerialNumber(request.getMeterSerialNumber());
            if (meter == null) {
                response.put("success", false);
                response.put("error", "Meter not found: " + request.getMeterSerialNumber());
                return ResponseEntity.badRequest().body(response);
            }

            CosemObject cosemObject = getCosemObjectFromString(request.getCosemObject());
            if (cosemObject == null) {
                response.put("success", false);
                response.put("error", "Invalid COSEM object: " + request.getCosemObject());
                return ResponseEntity.badRequest().body(response);
            }

            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                meter.getIpAddress(),
                meter.getPort(),
                cosemObject,
                null,
                false
            );

            MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);
            
            response.put("success", result.isSuccess());
            response.put("meterSerialNumber", request.getMeterSerialNumber());
            response.put("cosemObject", request.getCosemObject());
            response.put("timestamp", System.currentTimeMillis());
            
            if (result.isSuccess()) {
                response.put("message", "Read operation successful");
                response.put("value", result.getValue());
                log.info("Read operation successful for meter {} object {}: {}", 
                    request.getMeterSerialNumber(), request.getCosemObject(), result.getValue());
            } else {
                response.put("error", result.getError());
                log.warn("Read operation failed for meter {}: {}", request.getMeterSerialNumber(), result.getError());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during read operation for meter {}: {}", request.getMeterSerialNumber(), e.getMessage());
            response.put("success", false);
            response.put("error", "Read operation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Write meter data
     * POST /api/dlms/write
     */
    @PostMapping("/write")
    public ResponseEntity<Map<String, Object>> writeMeterData(@RequestBody WriteRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("Manual write operation for meter: {} - {} = {}", 
                request.getMeterSerialNumber(), request.getCosemObject(), request.getValue());
            
            Meter meter = meterService.getMeterBySerialNumber(request.getMeterSerialNumber());
            if (meter == null) {
                response.put("success", false);
                response.put("error", "Meter not found: " + request.getMeterSerialNumber());
                return ResponseEntity.badRequest().body(response);
            }

            CosemObject cosemObject = getCosemObjectFromString(request.getCosemObject());
            if (cosemObject == null) {
                response.put("success", false);
                response.put("error", "Invalid COSEM object: " + request.getCosemObject());
                return ResponseEntity.badRequest().body(response);
            }

            DataObject dataObject = createDataObject(request.getValue(), request.getDataType());
            if (dataObject == null) {
                response.put("success", false);
                response.put("error", "Invalid data type or value: " + request.getDataType());
                return ResponseEntity.badRequest().body(response);
            }

            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                meter.getIpAddress(),
                meter.getPort(),
                cosemObject,
                dataObject,
                true
            );

            MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);
            
            response.put("success", result.isSuccess());
            response.put("meterSerialNumber", request.getMeterSerialNumber());
            response.put("cosemObject", request.getCosemObject());
            response.put("value", request.getValue());
            response.put("timestamp", System.currentTimeMillis());
            
            if (result.isSuccess()) {
                response.put("message", "Write operation successful");
                log.info("Write operation successful for meter {} object {} = {}", 
                    request.getMeterSerialNumber(), request.getCosemObject(), request.getValue());
            } else {
                response.put("error", result.getError());
                log.warn("Write operation failed for meter {}: {}", request.getMeterSerialNumber(), result.getError());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during write operation for meter {}: {}", request.getMeterSerialNumber(), e.getMessage());
            response.put("success", false);
            response.put("error", "Write operation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get available meters
     * GET /api/dlms/meters
     */
    @GetMapping("/meters")
    public ResponseEntity<Map<String, Object>> getMeters() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Meter> meters = meterService.getAllMeters();
            response.put("success", true);
            response.put("meters", meters);
            response.put("count", meters.size());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting meters: {}", e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to get meters: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get simulator status
     * GET /api/dlms/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSimulatorStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String status = enhancedSimulatorService.getSimulatorStatus();
            response.put("success", true);
            response.put("status", status);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting simulator status: {}", e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to get simulator status: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get the current relay status of a meter
     * GET /api/dlms/relay/{meterSerialNumber}
     */
    @GetMapping("/relay/{meterSerialNumber}")
    public ResponseEntity<Map<String, Object>> getRelayStatus(@PathVariable String meterSerialNumber) {
        Map<String, Object> response = new HashMap<>();

        if (mockEnabled) {
            boolean isConnected = new Random().nextBoolean();
            String status = isConnected ? "CONNECTED" : "DISCONNECTED";
            log.info("MOCK MODE: Simulating relay status check for meter: {} - Status: {}", meterSerialNumber, status);
            response.put("success", true);
            response.put("meterSerialNumber", meterSerialNumber);
            response.put("status", status);
            response.put("isConnected", isConnected);
            response.put("message", "MOCK: Relay status read successfully");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        }

        try {
            log.info("Manual relay status request for meter: {}", meterSerialNumber);

            Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
            if (meter == null) {
                response.put("success", false);
                response.put("error", "Meter not found: " + meterSerialNumber);
                return ResponseEntity.badRequest().body(response);
            }

            if (meter.getPort() == null) {
                response.put("success", false);
                response.put("error", "Relay status check failed: Meter does not have a port configured.");
                log.error("Relay status check failed for meter {}: Port is not configured.", meterSerialNumber);
                return ResponseEntity.badRequest().body(response);
            }

            CompletableFuture<MeterTransaction.Result> future = meterCommunicationService.communicate(
                    meter.getIpAddress(),
                    meter.getPort(),
                    CosemObject.StandardObjects.RELAY_CONTROL, // Use the same object for reading
                    null,
                    false // This flag indicates a 'get' operation
            );

            MeterTransaction.Result result = future.get(10, TimeUnit.SECONDS);

            response.put("success", result.isSuccess());
            response.put("meterSerialNumber", meterSerialNumber);
            response.put("timestamp", System.currentTimeMillis());

            if (result.isSuccess()) {
                // The result value is a DataObject, we need to extract the boolean
                DataObject dataObject = (DataObject) result.getValue();
                boolean isConnected = false; // Default to false
                if (dataObject != null && dataObject.isBoolean()) {
                    isConnected = dataObject.asBoolean();
                }
                
                String status = isConnected ? "CONNECTED" : "DISCONNECTED";
                response.put("status", status);
                response.put("isConnected", isConnected);
                response.put("message", "Relay status read successfully");
                log.info("Relay status for meter {}: {}", meterSerialNumber, status);
            } else {
                response.put("error", result.getError());
                log.warn("Failed to get relay status for meter {}: {}", meterSerialNumber, result.getError());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error during relay status check for meter {}: {}", meterSerialNumber, e.getMessage());
            response.put("success", false);
            response.put("error", "Relay status check failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Helper methods
    private CosemObject getCosemObjectFromString(String objectName) {
        try {
            return CosemObject.StandardObjects.valueOf(objectName.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private DataObject createDataObject(Object value, String dataType) {
        try {
            switch (dataType.toLowerCase()) {
                case "boolean":
                    return DataObject.newBoolean((Boolean) value);
                case "integer":
                    return DataObject.newInteger((Integer) value);
                case "long":
                    return DataObject.newLong((Long) value);
                case "double":
                    return DataObject.newDouble((Double) value);
                case "string":
                    return DataObject.newString((String) value);
                case "octet_string":
                    return DataObject.newOctetString((String) value);
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    // Request/Response DTOs
    public static class PingRequest {
        private String meterSerialNumber;

        public String getMeterSerialNumber() { return meterSerialNumber; }
        public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
    }

    public static class RelayRequest {
        private String meterSerialNumber;
        private boolean connect;

        public String getMeterSerialNumber() { return meterSerialNumber; }
        public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
        
        public boolean isConnect() { return connect; }
        public void setConnect(boolean connect) { this.connect = connect; }
    }

    public static class ReadRequest {
        private String meterSerialNumber;
        private String cosemObject;

        public String getMeterSerialNumber() { return meterSerialNumber; }
        public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
        
        public String getCosemObject() { return cosemObject; }
        public void setCosemObject(String cosemObject) { this.cosemObject = cosemObject; }
    }

    public static class WriteRequest {
        private String meterSerialNumber;
        private String cosemObject;
        private Object value;
        private String dataType;

        public String getMeterSerialNumber() { return meterSerialNumber; }
        public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
        
        public String getCosemObject() { return cosemObject; }
        public void setCosemObject(String cosemObject) { this.cosemObject = cosemObject; }
        
        public Object getValue() { return value; }
        public void setValue(Object value) { this.value = value; }
        
        public String getDataType() { return dataType; }
        public void setDataType(String dataType) { this.dataType = dataType; }
    }
} 