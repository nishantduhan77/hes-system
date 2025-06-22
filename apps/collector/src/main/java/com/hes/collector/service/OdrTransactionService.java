package com.hes.collector.service;

import com.hes.collector.model.MeterTransaction;
import com.hes.collector.model.Meter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class OdrTransactionService {
    
    private static final Logger log = LoggerFactory.getLogger(OdrTransactionService.class);
    private final Map<UUID, OdrTransaction> odrTransactions;
    private final MeterService meterService;
    
    @Autowired
    public OdrTransactionService(MeterService meterService) {
        this.odrTransactions = new ConcurrentHashMap<>();
        this.meterService = meterService;
    }
    
    /**
     * Create a new ODR transaction
     */
    public OdrTransaction createOdrTransaction(String meterSerialNumber, String action, String odrOperation) {
        // Validate meter exists
        Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
        if (meter == null) {
            log.warn("Attempted to create ODR transaction for non-existent meter: {}", meterSerialNumber);
            return null;
        }
        
        UUID transactionId = UUID.randomUUID();
        OdrTransaction transaction = new OdrTransaction();
        transaction.setTransactionId(transactionId);
        transaction.setMeterSerialNumber(meterSerialNumber);
        transaction.setAction(action);
        transaction.setOdrOperation(odrOperation);
        transaction.setStatus(OdrTransactionStatus.REQUESTED);
        transaction.setRequestTime(Instant.now());
        transaction.setExpiryTime(Instant.now().plusSeconds(300)); // 5 minutes expiry
        
        odrTransactions.put(transactionId, transaction);
        
        log.info("Created ODR transaction: {} for meter: {} action: {}", 
            transactionId, meterSerialNumber, action);
        
        return transaction;
    }
    
    /**
     * Get ODR transaction by ID
     */
    public OdrTransaction getOdrTransaction(UUID transactionId) {
        OdrTransaction transaction = odrTransactions.get(transactionId);
        if (transaction != null) {
            // Check if transaction has expired
            if (Instant.now().isAfter(transaction.getExpiryTime())) {
                log.warn("ODR transaction expired: {}", transactionId);
                odrTransactions.remove(transactionId);
                return null;
            }
        }
        return transaction;
    }
    
    /**
     * Update ODR transaction with data
     */
    public boolean updateOdrTransactionData(UUID transactionId, Map<String, Object> data) {
        OdrTransaction transaction = odrTransactions.get(transactionId);
        if (transaction != null) {
            transaction.setData(data);
            transaction.setStatus(OdrTransactionStatus.COMPLETED);
            transaction.setCompletionTime(Instant.now());
            log.info("Updated ODR transaction with data: {}", transactionId);
            return true;
        }
        return false;
    }
    
    /**
     * Mark ODR transaction as failed
     */
    public boolean markOdrTransactionFailed(UUID transactionId, String error) {
        OdrTransaction transaction = odrTransactions.get(transactionId);
        if (transaction != null) {
            transaction.setStatus(OdrTransactionStatus.FAILED);
            transaction.setError(error);
            transaction.setCompletionTime(Instant.now());
            log.warn("Marked ODR transaction as failed: {} - {}", transactionId, error);
            return true;
        }
        return false;
    }
    
    /**
     * Clean up expired transactions
     */
    public void cleanupExpiredTransactions() {
        Instant now = Instant.now();
        odrTransactions.entrySet().removeIf(entry -> {
            OdrTransaction transaction = entry.getValue();
            if (now.isAfter(transaction.getExpiryTime())) {
                log.debug("Cleaning up expired ODR transaction: {}", entry.getKey());
                return true;
            }
            return false;
        });
    }
    
    /**
     * Validate meter exists in system
     */
    public boolean validateMeter(String meterSerialNumber) {
        Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
        return meter != null;
    }
    
    /**
     * ODR Transaction inner class
     */
    public static class OdrTransaction {
        private UUID transactionId;
        private String meterSerialNumber;
        private String action;
        private String odrOperation;
        private OdrTransactionStatus status;
        private Instant requestTime;
        private Instant completionTime;
        private Instant expiryTime;
        private Map<String, Object> data;
        private String error;
        
        // Getters and Setters
        public UUID getTransactionId() { return transactionId; }
        public void setTransactionId(UUID transactionId) { this.transactionId = transactionId; }
        
        public String getMeterSerialNumber() { return meterSerialNumber; }
        public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
        
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        
        public String getOdrOperation() { return odrOperation; }
        public void setOdrOperation(String odrOperation) { this.odrOperation = odrOperation; }
        
        public OdrTransactionStatus getStatus() { return status; }
        public void setStatus(OdrTransactionStatus status) { this.status = status; }
        
        public Instant getRequestTime() { return requestTime; }
        public void setRequestTime(Instant requestTime) { this.requestTime = requestTime; }
        
        public Instant getCompletionTime() { return completionTime; }
        public void setCompletionTime(Instant completionTime) { this.completionTime = completionTime; }
        
        public Instant getExpiryTime() { return expiryTime; }
        public void setExpiryTime(Instant expiryTime) { this.expiryTime = expiryTime; }
        
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    /**
     * ODR Transaction Status enum
     */
    public enum OdrTransactionStatus {
        REQUESTED,
        PROCESSING,
        COMPLETED,
        FAILED,
        EXPIRED
    }
} 