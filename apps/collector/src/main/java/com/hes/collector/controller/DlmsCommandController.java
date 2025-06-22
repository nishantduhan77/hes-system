package com.hes.collector.controller;

import com.hes.collector.model.MeterTransaction;
import com.hes.collector.dlms.CosemObject;
import com.hes.collector.dlms.DataObject;
import com.hes.collector.service.EnhancedSimulatorService;
import com.hes.collector.service.MeterCommunicationService;
import com.hes.collector.service.MeterService;
import com.hes.collector.model.Meter;
import com.hes.collector.service.OdrTransactionService;
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
import java.util.UUID;
import java.util.ArrayList;

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

    @Autowired
    private OdrTransactionService odrTransactionService;

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

            if (meter.getPort() == null) {
                response.put("success", false);
                response.put("error", "Read operation failed: Meter does not have a port configured.");
                log.error("Read failed for meter {}: Port is not configured.", request.getMeterSerialNumber());
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
                log.info("Read successful for meter {} object {}: {}", 
                    request.getMeterSerialNumber(), request.getCosemObject(), result.getValue());
            } else {
                response.put("error", result.getError());
                log.warn("Read failed for meter {} object {}: {}", 
                    request.getMeterSerialNumber(), request.getCosemObject(), result.getError());
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

    /**
     * ODR: Instantaneous Reading - Request reading and get transaction ID
     * POST /collector/api/dlms/odr/{meter}/actions/instantaneous
     */
    @PostMapping("/odr/{meter}/actions/instantaneous")
    public ResponseEntity<Map<String, Object>> requestInstantaneousReading(@PathVariable String meter) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate meter exists in system
            if (!odrTransactionService.validateMeter(meter)) {
                response.put("success", false);
                response.put("error", "Meter not found in system: " + meter);
                log.warn("ODR request for non-existent meter: {}", meter);
                return ResponseEntity.badRequest().body(response);
            }

            if (mockEnabled) {
                log.info("MOCK MODE: Simulating instantaneous reading request for meter: {}", meter);
                
                // Create ODR transaction
                OdrTransactionService.OdrTransaction transaction = odrTransactionService.createOdrTransaction(
                    meter, "instantaneous", "INSTANTANEOUS_READING");
                
                if (transaction != null) {
                    // Immediately update with mock data for mock mode
                    odrTransactionService.updateOdrTransactionData(transaction.getTransactionId(), 
                        createMockInstantaneousData());
                    
                    response.put("success", true);
                    response.put("transactionId", transaction.getTransactionId().toString());
                    response.put("meterSerialNumber", meter);
                    response.put("action", "instantaneous");
                    response.put("message", "Instantaneous reading request accepted");
                    response.put("timestamp", System.currentTimeMillis());
                } else {
                    response.put("success", false);
                    response.put("error", "Failed to create transaction");
                }
                return ResponseEntity.ok(response);
            }

            log.info("ODR Instantaneous reading request for meter: {}", meter);
            
            // Create ODR transaction
            OdrTransactionService.OdrTransaction odrTransaction = odrTransactionService.createOdrTransaction(
                meter, "instantaneous", "INSTANTANEOUS_READING");
            
            if (odrTransaction == null) {
                response.put("success", false);
                response.put("error", "Failed to create ODR transaction");
                return ResponseEntity.internalServerError().body(response);
            }

            // Use the simulator to perform instantaneous reading operation
            MeterTransaction meterTransaction = enhancedSimulatorService.performInstantaneousReading(meter);
            
            if (meterTransaction != null && meterTransaction.getResult().isSuccess()) {
                // Update ODR transaction with success status and data
                odrTransactionService.updateOdrTransactionData(odrTransaction.getTransactionId(), 
                    createMockInstantaneousData());
                
                response.put("success", true);
                response.put("transactionId", odrTransaction.getTransactionId().toString());
                response.put("meterSerialNumber", meter);
                response.put("action", "instantaneous");
                response.put("message", "Instantaneous reading request accepted");
                response.put("timestamp", System.currentTimeMillis());
                log.info("Instantaneous reading request accepted for meter: {} with transaction ID: {}", 
                    meter, odrTransaction.getTransactionId());
            } else {
                // Mark ODR transaction as failed
                String error = meterTransaction != null ? meterTransaction.getResult().getError() : "Unknown error";
                odrTransactionService.markOdrTransactionFailed(odrTransaction.getTransactionId(), error);
                
                response.put("success", false);
                response.put("error", error);
                log.warn("Instantaneous reading request failed for meter {}: {}", meter, error);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during instantaneous reading request for meter {}: {}", meter, e.getMessage());
            response.put("success", false);
            response.put("error", "Instantaneous reading request failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * ODR: Retrieve data using transaction ID
     * GET /collector/api/dlms/odr/data/data?sessionId={transactionId}&action={actionType}&sortDirection=ASC&pageSize=20
     */
    @GetMapping("/odr/data/data")
    public ResponseEntity<Map<String, Object>> getDataByTransactionId(
            @RequestParam String sessionId,
            @RequestParam(defaultValue = "instantaneous") String action,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(defaultValue = "20") int pageSize) {
        
        Map<String, Object> response = new HashMap<>();

        try {
            log.info("Retrieving data for transaction ID: {}, action: {}, sortDirection: {}, pageSize: {}", 
                sessionId, action, sortDirection, pageSize);
            
            // Validate transaction ID format
            UUID transactionId;
            try {
                transactionId = UUID.fromString(sessionId);
            } catch (IllegalArgumentException e) {
                response.put("success", false);
                response.put("error", "Invalid transaction ID format");
                return ResponseEntity.badRequest().body(response);
            }

            // Get ODR transaction from storage
            OdrTransactionService.OdrTransaction odrTransaction = odrTransactionService.getOdrTransaction(transactionId);
            if (odrTransaction == null) {
                response.put("success", false);
                response.put("error", "Transaction not found or expired");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate transaction status
            if (odrTransaction.getStatus() == OdrTransactionService.OdrTransactionStatus.FAILED) {
                response.put("success", false);
                response.put("error", "Transaction failed: " + odrTransaction.getError());
                return ResponseEntity.badRequest().body(response);
            }

            if (odrTransaction.getStatus() == OdrTransactionService.OdrTransactionStatus.REQUESTED) {
                response.put("success", false);
                response.put("error", "Transaction is still being processed");
                return ResponseEntity.badRequest().body(response);
            }

            // Get data from transaction
            Map<String, Object> data = odrTransaction.getData();
            if (data == null) {
                response.put("success", false);
                response.put("error", "No data available for this transaction");
                return ResponseEntity.badRequest().body(response);
            }
            
            response.put("success", true);
            response.put("transactionId", sessionId);
            response.put("action", odrTransaction.getAction());
            response.put("data", data);
            response.put("sortDirection", sortDirection);
            response.put("pageSize", pageSize);
            response.put("totalRecords", 1);
            response.put("timestamp", System.currentTimeMillis());
            response.put("transactionStatus", odrTransaction.getStatus().toString());
            response.put("requestTime", odrTransaction.getRequestTime());
            response.put("completionTime", odrTransaction.getCompletionTime());
            
            log.info("Data retrieved successfully for transaction ID: {} and action: {}", sessionId, action);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error retrieving data for transaction ID {}: {}", sessionId, e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to retrieve data: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * ODR: Daily Load Profile - Request reading and get transaction ID
     * POST /collector/api/dlms/odr/{meter}/actions/dailyload_profile
     */
    @PostMapping("/odr/{meter}/actions/dailyload_profile")
    public ResponseEntity<Map<String, Object>> requestDailyLoadProfile(@PathVariable String meter) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate meter exists in system
            if (!odrTransactionService.validateMeter(meter)) {
                response.put("success", false);
                response.put("error", "Meter not found in system: " + meter);
                log.warn("ODR request for non-existent meter: {}", meter);
                return ResponseEntity.badRequest().body(response);
            }

            log.info("ODR Daily load profile request for meter: {}", meter);
            
            // Create ODR transaction
            OdrTransactionService.OdrTransaction odrTransaction = odrTransactionService.createOdrTransaction(
                meter, "dailyload_profile", "DAILY_LOAD_PROFILE");
            
            if (odrTransaction == null) {
                response.put("success", false);
                response.put("error", "Failed to create ODR transaction");
                return ResponseEntity.internalServerError().body(response);
            }

            // Generate data and update transaction immediately
            Map<String, Object> dailyData = getDailyLoadProfileData(meter);
            odrTransactionService.updateOdrTransactionData(odrTransaction.getTransactionId(), dailyData);
            
            response.put("success", true);
            response.put("transactionId", odrTransaction.getTransactionId().toString());
            response.put("meterSerialNumber", meter);
            response.put("action", "dailyload_profile");
            response.put("message", "Daily load profile request accepted");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during daily load profile request for meter {}: {}", meter, e.getMessage());
            response.put("success", false);
            response.put("error", "Daily load profile request failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * ODR: Billing Profile - Request reading and get transaction ID
     * POST /collector/api/dlms/odr/{meter}/actions/billing_profile
     */
    @PostMapping("/odr/{meter}/actions/billing_profile")
    public ResponseEntity<Map<String, Object>> requestBillingProfile(@PathVariable String meter) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate meter exists in system
            if (!odrTransactionService.validateMeter(meter)) {
                response.put("success", false);
                response.put("error", "Meter not found in system: " + meter);
                log.warn("ODR request for non-existent meter: {}", meter);
                return ResponseEntity.badRequest().body(response);
            }

            log.info("ODR Billing profile request for meter: {}", meter);
            
            // Create ODR transaction
            OdrTransactionService.OdrTransaction odrTransaction = odrTransactionService.createOdrTransaction(
                meter, "billing_profile", "BILLING_PROFILE");
            
            if (odrTransaction == null) {
                response.put("success", false);
                response.put("error", "Failed to create ODR transaction");
                return ResponseEntity.internalServerError().body(response);
            }

            // Generate data and update transaction immediately
            Map<String, Object> billingData = getBillingProfileData(meter);
            odrTransactionService.updateOdrTransactionData(odrTransaction.getTransactionId(), billingData);
            
            response.put("success", true);
            response.put("transactionId", odrTransaction.getTransactionId().toString());
            response.put("meterSerialNumber", meter);
            response.put("action", "billing_profile");
            response.put("message", "Billing profile request accepted");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during billing profile request for meter {}: {}", meter, e.getMessage());
            response.put("success", false);
            response.put("error", "Billing profile request failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * ODR: Block Load Profile - Request reading and get transaction ID
     * POST /collector/api/dlms/odr/{meter}/actions/block_load_profile
     */
    @PostMapping("/odr/{meter}/actions/block_load_profile")
    public ResponseEntity<Map<String, Object>> requestBlockLoadProfile(@PathVariable String meter) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate meter exists in system
            if (!odrTransactionService.validateMeter(meter)) {
                response.put("success", false);
                response.put("error", "Meter not found in system: " + meter);
                log.warn("ODR request for non-existent meter: {}", meter);
                return ResponseEntity.badRequest().body(response);
            }

            log.info("ODR Block load profile request for meter: {}", meter);
            
            // Create ODR transaction
            OdrTransactionService.OdrTransaction odrTransaction = odrTransactionService.createOdrTransaction(
                meter, "block_load_profile", "BLOCK_LOAD_PROFILE");
            
            if (odrTransaction == null) {
                response.put("success", false);
                response.put("error", "Failed to create ODR transaction");
                return ResponseEntity.internalServerError().body(response);
            }

            // Generate data and update transaction immediately
            Map<String, Object> blockData = getBlockLoadProfileData(meter);
            odrTransactionService.updateOdrTransactionData(odrTransaction.getTransactionId(), blockData);
            
            response.put("success", true);
            response.put("transactionId", odrTransaction.getTransactionId().toString());
            response.put("meterSerialNumber", meter);
            response.put("action", "block_load_profile");
            response.put("message", "Block load profile request accepted");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during block load profile request for meter {}: {}", meter, e.getMessage());
            response.put("success", false);
            response.put("error", "Block load profile request failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * ODR: Events - Request reading and get transaction ID
     * POST /collector/api/dlms/odr/{meter}/actions/events
     */
    @PostMapping("/odr/{meter}/actions/events")
    public ResponseEntity<Map<String, Object>> requestEvents(@PathVariable String meter) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate meter exists in system
            if (!odrTransactionService.validateMeter(meter)) {
                response.put("success", false);
                response.put("error", "Meter not found in system: " + meter);
                log.warn("ODR request for non-existent meter: {}", meter);
                return ResponseEntity.badRequest().body(response);
            }

            log.info("ODR Events request for meter: {}", meter);
            
            // Create ODR transaction
            OdrTransactionService.OdrTransaction odrTransaction = odrTransactionService.createOdrTransaction(
                meter, "events", "EVENTS");
            
            if (odrTransaction == null) {
                response.put("success", false);
                response.put("error", "Failed to create ODR transaction");
                return ResponseEntity.internalServerError().body(response);
            }

            // Generate data and update transaction immediately
            Map<String, Object> eventsData = getEventsData(meter);
            odrTransactionService.updateOdrTransactionData(odrTransaction.getTransactionId(), eventsData);
            
            response.put("success", true);
            response.put("transactionId", odrTransaction.getTransactionId().toString());
            response.put("meterSerialNumber", meter);
            response.put("action", "events");
            response.put("message", "Events request accepted");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during events request for meter {}: {}", meter, e.getMessage());
            response.put("success", false);
            response.put("error", "Events request failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * ODR: Enhanced Ping operation for connectivity verification
     * POST /collector/api/dlms/odr/{meter}/actions/ping
     */
    @PostMapping("/odr/{meter}/actions/ping")
    public ResponseEntity<Map<String, Object>> enhancedPing(@PathVariable String meter) {
        Map<String, Object> response = new HashMap<>();

        if (mockEnabled) {
            log.info("MOCK MODE: Simulating successful enhanced ping for meter: {}", meter);
            response.put("success", true);
            response.put("transactionId", "MOCK_" + System.currentTimeMillis());
            response.put("meterSerialNumber", meter);
            response.put("action", "ping");
            response.put("message", "MOCK: Enhanced ping successful");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        }

        try {
            log.info("ODR Enhanced ping request for meter: {}", meter);
            
            Meter meterObj = meterService.getMeterBySerialNumber(meter);
            if (meterObj == null) {
                response.put("success", false);
                response.put("error", "Meter not found: " + meter);
                return ResponseEntity.badRequest().body(response);
            }

            // Use the simulator to perform enhanced ping operation
            MeterTransaction transaction = enhancedSimulatorService.performPingOperation(meter);
            
            if (transaction != null && transaction.getResult().isSuccess()) {
                response.put("success", true);
                response.put("transactionId", transaction.getTransactionId().toString());
                response.put("meterSerialNumber", meter);
                response.put("action", "ping");
                response.put("message", "Enhanced ping operation successful");
                response.put("timestamp", System.currentTimeMillis());
                log.info("Enhanced ping operation successful for meter: {}", meter);
            } else {
                response.put("success", false);
                response.put("error", transaction != null ? transaction.getResult().getError() : "Enhanced ping operation failed");
                log.warn("Enhanced ping operation failed for meter {}: {}", 
                    meter, 
                    transaction != null ? transaction.getResult().getError() : "Unknown error");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during enhanced ping operation for meter {}: {}", meter, e.getMessage());
            response.put("success", false);
            response.put("error", "Enhanced ping operation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get transaction status
     * GET /api/dlms/transaction/{transactionId}
     */
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<Map<String, Object>> getTransactionStatus(@PathVariable String transactionId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("Getting transaction status for: {}", transactionId);
            
            // TODO: Implement transaction status retrieval from database
            // For now, return a mock response
            response.put("success", true);
            response.put("transactionId", transactionId);
            response.put("status", "COMPLETED");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting transaction status for {}: {}", transactionId, e.getMessage());
            response.put("success", false);
            response.put("error", "Failed to get transaction status: " + e.getMessage());
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

    // Helper methods for data retrieval
    private Map<String, Object> createMockInstantaneousData() {
        Map<String, Object> data = new HashMap<>();
        Random random = new Random();
        
        // Current values (L1, L2, L3)
        Map<String, Double> current = new HashMap<>();
        current.put("L1", 10.5 + random.nextDouble() * 5.0);
        current.put("L2", 11.2 + random.nextDouble() * 5.0);
        current.put("L3", 9.8 + random.nextDouble() * 5.0);
        data.put("current", current);
        
        // Voltage values (L1, L2, L3)
        Map<String, Double> voltage = new HashMap<>();
        voltage.put("L1", 230.0 + random.nextDouble() * 10.0);
        voltage.put("L2", 228.0 + random.nextDouble() * 10.0);
        voltage.put("L3", 232.0 + random.nextDouble() * 10.0);
        data.put("voltage", voltage);
        
        // Power factors (L1, L2, L3, three-phase)
        Map<String, Double> powerFactor = new HashMap<>();
        powerFactor.put("L1", 0.95 + random.nextDouble() * 0.05);
        powerFactor.put("L2", 0.93 + random.nextDouble() * 0.05);
        powerFactor.put("L3", 0.97 + random.nextDouble() * 0.03);
        powerFactor.put("three_phase", 0.95 + random.nextDouble() * 0.05);
        data.put("power_factor", powerFactor);
        
        // Frequency
        data.put("frequency", 50.0 + random.nextDouble() * 0.2);
        
        // Power values
        data.put("apparent_power", 5000.0 + random.nextDouble() * 1000.0);
        data.put("active_power", 4500.0 + random.nextDouble() * 800.0);
        data.put("reactive_power", 1200.0 + random.nextDouble() * 400.0);
        
        // Cumulative energy
        Map<String, Double> energy = new HashMap<>();
        energy.put("import", 150000.0 + random.nextDouble() * 10000.0);
        energy.put("export", 5000.0 + random.nextDouble() * 2000.0);
        data.put("cumulative_energy", energy);
        
        return data;
    }

    private Map<String, Object> getInstantaneousDataFromDatabase(String meterSerialNumber) {
        // For now, return mock data since we don't have the database services injected
        return createMockInstantaneousData();
    }

    private Map<String, Object> getDailyLoadProfileData(String meterSerialNumber) {
        Map<String, Object> data = new HashMap<>();
        try {
            // Generate mock daily load profile data for the last 24 hours
            List<Map<String, Object>> profileData = new ArrayList<>();
            long currentTime = System.currentTimeMillis();
            
            // Generate 24 data points for 24 hours (hourly intervals)
            for (int i = 0; i < 24; i++) {
                Map<String, Object> point = new HashMap<>();
                point.put("timestamp", currentTime - (24 - i) * 60 * 60 * 1000);
                point.put("active_power", 4000.0 + Math.random() * 2000.0);
                point.put("reactive_power", 1000.0 + Math.random() * 500.0);
                point.put("apparent_power", 4500.0 + Math.random() * 2500.0);
                profileData.add(point);
            }
            
            data.put("profile_data", profileData);
            data.put("total_points", profileData.size());
            data.put("time_range", "24_hours");
            
        } catch (Exception e) {
            log.warn("Error generating daily load profile for meter {}: {}", meterSerialNumber, e.getMessage());
            data.put("error", "Failed to generate daily load profile data");
        }
        return data;
    }

    private Map<String, Object> getBillingProfileData(String meterSerialNumber) {
        Map<String, Object> data = new HashMap<>();
        try {
            // Generate mock billing profile data (monthly aggregated data)
            Map<String, Object> billingInfo = new HashMap<>();
            billingInfo.put("billing_period", "current_month");
            billingInfo.put("total_energy_import", 150000.0);
            billingInfo.put("total_energy_export", 5000.0);
            billingInfo.put("peak_demand", 8500.0);
            billingInfo.put("average_demand", 4500.0);
            billingInfo.put("power_factor_average", 0.95);
            
            data.put("billing_info", billingInfo);
            data.put("billing_date", System.currentTimeMillis());
            
        } catch (Exception e) {
            log.warn("Error generating billing profile for meter {}: {}", meterSerialNumber, e.getMessage());
            data.put("error", "Failed to generate billing profile data");
        }
        return data;
    }

    private Map<String, Object> getBlockLoadProfileData(String meterSerialNumber) {
        Map<String, Object> data = new HashMap<>();
        try {
            // Generate mock block load profile data (15-minute intervals)
            List<Map<String, Object>> blockData = new ArrayList<>();
            long currentTime = System.currentTimeMillis();
            
            // Generate 96 data points for 24 hours (15-minute intervals)
            for (int i = 0; i < 96; i++) {
                Map<String, Object> block = new HashMap<>();
                block.put("timestamp", currentTime - (96 - i) * 15 * 60 * 1000);
                block.put("active_power", 4000.0 + Math.random() * 2000.0);
                block.put("reactive_power", 1000.0 + Math.random() * 500.0);
                block.put("apparent_power", 4500.0 + Math.random() * 2500.0);
                blockData.add(block);
            }
            
            data.put("block_data", blockData);
            data.put("interval_minutes", 15);
            data.put("total_blocks", blockData.size());
            
        } catch (Exception e) {
            log.warn("Error generating block load profile for meter {}: {}", meterSerialNumber, e.getMessage());
            data.put("error", "Failed to generate block load profile data");
        }
        return data;
    }

    private Map<String, Object> getEventsData(String meterSerialNumber) {
        Map<String, Object> data = new HashMap<>();
        try {
            // Generate mock events data
            List<Map<String, Object>> eventList = new ArrayList<>();
            
            // Generate some sample events
            String[] eventTypes = {"POWER_FAILURE", "VOLTAGE_MISSING", "CURRENT_REVERSE", "CT_OPEN"};
            String[] severities = {"INFO", "WARNING", "CRITICAL"};
            
            for (int i = 0; i < 5; i++) {
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("event_id", "EVT_" + System.currentTimeMillis() + "_" + i);
                eventData.put("event_type", eventTypes[i % eventTypes.length]);
                eventData.put("timestamp", System.currentTimeMillis() - (i * 3600000)); // 1 hour apart
                eventData.put("description", "Sample event " + (i + 1) + " for meter " + meterSerialNumber);
                eventData.put("severity", severities[i % severities.length]);
                eventList.add(eventData);
            }
            
            data.put("events", eventList);
            data.put("total_events", eventList.size());
            data.put("time_range", "recent");
            
        } catch (Exception e) {
            log.warn("Error generating events for meter {}: {}", meterSerialNumber, e.getMessage());
            data.put("error", "Failed to generate events data");
        }
        return data;
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

    public static class OdrRequest {
        private String meterSerialNumber;

        public String getMeterSerialNumber() { return meterSerialNumber; }
        public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
    }

    public static class InstantaneousRequest {
        private String meterSerialNumber;

        public String getMeterSerialNumber() { return meterSerialNumber; }
        public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
    }
} 