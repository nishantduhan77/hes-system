package com.hes.collector.model;

import com.hes.collector.dlms.DataObject;
import java.time.Instant;
import java.util.UUID;

public class MeterTransaction {
    private UUID transactionId;
    private String meterSerialNumber;
    private String ipAddress;
    private int port;
    private TransactionType type;
    private TransactionStatus status;
    private int retryCount;
    private Instant startTime;
    private Instant lastAttemptTime;
    private Instant completionTime;
    private String errorMessage;
    private Result result;
    // ODR-specific fields
    private String odrOperation;        // RC, DC, ENHANCED_PING
    private String[] cosemObjects;      // For DC operations
    private String odrRequestId;        // Unique ODR request identifier
    private Instant odrRequestTime;     // When ODR was requested
    private String odrResponseData;     // ODR response data

    public MeterTransaction(UUID transactionId, String meterSerialNumber, String ipAddress, int port, TransactionType type, TransactionStatus status, int retryCount, Instant startTime, Instant lastAttemptTime, Instant completionTime, String errorMessage, Result result) {
        this.transactionId = transactionId;
        this.meterSerialNumber = meterSerialNumber;
        this.ipAddress = ipAddress;
        this.port = port;
        this.type = type;
        this.status = status;
        this.retryCount = retryCount;
        this.startTime = startTime;
        this.lastAttemptTime = lastAttemptTime;
        this.completionTime = completionTime;
        this.errorMessage = errorMessage;
        this.result = result;
        // Initialize ODR fields
        this.odrRequestTime = Instant.now();
        this.odrRequestId = "ODR_" + System.currentTimeMillis();
    }

    public MeterTransaction() {}

    public enum TransactionType {
        PING,
        READ,
        WRITE,
        CONNECT,
        DISCONNECT,
        // ODR-specific transaction types
        INSTANTANEOUS_READING,  // Read all current meter values
        ENHANCED_PING          // Enhanced ping for connectivity verification
    }

    public enum TransactionStatus {
        INITIATED,
        IN_PROGRESS,
        RETRY,
        COMPLETED,
        FAILED,
        TIMEOUT,
        // ODR-specific statuses
        ODR_REQUESTED,  // ODR request received
        ODR_PROCESSING, // ODR operation in progress
        ODR_SUCCESS,    // ODR operation successful
        ODR_FAILED      // ODR operation failed
    }

    public boolean isComplete() {
        return status == TransactionStatus.COMPLETED || 
               status == TransactionStatus.FAILED || 
               status == TransactionStatus.TIMEOUT;
    }

    public boolean canRetry() {
        return retryCount < 3 && 
               (status == TransactionStatus.FAILED || status == TransactionStatus.TIMEOUT) &&
               startTime.plusSeconds(120).isAfter(Instant.now());
    }

    public static class Result {
        private boolean success;
        private String error;
        private DataObject value;
        private Instant timestamp;

        public Result() {}

        public boolean isSuccess() { return success; }
        public String getError() { return error; }
        public DataObject getValue() { return value; }
        public Instant getTimestamp() { return timestamp; }

        public void setSuccess(boolean success) { this.success = success; }
        public void setError(String error) { this.error = error; }
        public void setValue(DataObject value) { this.value = value; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }

    public UUID getTransactionId() {
        return this.transactionId;
    }

    // Getters for all fields
    public String getMeterSerialNumber() { return meterSerialNumber; }
    public String getIpAddress() { return ipAddress; }
    public int getPort() { return port; }
    public TransactionType getType() { return type; }
    public TransactionStatus getStatus() { return status; }
    public int getRetryCount() { return retryCount; }
    public Instant getStartTime() { return startTime; }
    public Instant getLastAttemptTime() { return lastAttemptTime; }
    public Instant getCompletionTime() { return completionTime; }
    public String getErrorMessage() { return errorMessage; }
    public Result getResult() { return result; }
    public String getOdrOperation() { return odrOperation; }
    public String[] getCosemObjects() { return cosemObjects; }
    public String getOdrRequestId() { return odrRequestId; }
    public Instant getOdrRequestTime() { return odrRequestTime; }
    public String getOdrResponseData() { return odrResponseData; }

    // Setters for all fields
    public void setTransactionId(UUID transactionId) { this.transactionId = transactionId; }
    public void setMeterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public void setPort(int port) { this.port = port; }
    public void setType(TransactionType type) { this.type = type; }
    public void setStatus(TransactionStatus status) { this.status = status; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public void setLastAttemptTime(Instant lastAttemptTime) { this.lastAttemptTime = lastAttemptTime; }
    public void setCompletionTime(Instant completionTime) { this.completionTime = completionTime; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public void setResult(Result result) { this.result = result; }
    public void setOdrOperation(String odrOperation) { this.odrOperation = odrOperation; }
    public void setCosemObjects(String[] cosemObjects) { this.cosemObjects = cosemObjects; }
    public void setOdrRequestId(String odrRequestId) { this.odrRequestId = odrRequestId; }
    public void setOdrRequestTime(Instant odrRequestTime) { this.odrRequestTime = odrRequestTime; }
    public void setOdrResponseData(String odrResponseData) { this.odrResponseData = odrResponseData; }

    // Static builder method for compatibility
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID transactionId;
        private String meterSerialNumber;
        private String ipAddress;
        private int port;
        private TransactionType type;
        private TransactionStatus status;
        private int retryCount;
        private Instant startTime;
        private Instant lastAttemptTime;
        private Instant completionTime;
        private String errorMessage;
        private Result result;
        private String odrOperation;
        private String[] cosemObjects;
        private String odrRequestId;
        private Instant odrRequestTime;
        private String odrResponseData;

        public Builder transactionId(UUID transactionId) { this.transactionId = transactionId; return this; }
        public Builder meterSerialNumber(String meterSerialNumber) { this.meterSerialNumber = meterSerialNumber; return this; }
        public Builder ipAddress(String ipAddress) { this.ipAddress = ipAddress; return this; }
        public Builder port(int port) { this.port = port; return this; }
        public Builder type(TransactionType type) { this.type = type; return this; }
        public Builder status(TransactionStatus status) { this.status = status; return this; }
        public Builder retryCount(int retryCount) { this.retryCount = retryCount; return this; }
        public Builder startTime(Instant startTime) { this.startTime = startTime; return this; }
        public Builder lastAttemptTime(Instant lastAttemptTime) { this.lastAttemptTime = lastAttemptTime; return this; }
        public Builder completionTime(Instant completionTime) { this.completionTime = completionTime; return this; }
        public Builder errorMessage(String errorMessage) { this.errorMessage = errorMessage; return this; }
        public Builder result(Result result) { this.result = result; return this; }
        public Builder odrOperation(String odrOperation) { this.odrOperation = odrOperation; return this; }
        public Builder cosemObjects(String[] cosemObjects) { this.cosemObjects = cosemObjects; return this; }
        public Builder odrRequestId(String odrRequestId) { this.odrRequestId = odrRequestId; return this; }
        public Builder odrRequestTime(Instant odrRequestTime) { this.odrRequestTime = odrRequestTime; return this; }
        public Builder odrResponseData(String odrResponseData) { this.odrResponseData = odrResponseData; return this; }

        public MeterTransaction build() {
            MeterTransaction transaction = new MeterTransaction(transactionId, meterSerialNumber, ipAddress, port, type, status, 
                retryCount, startTime, lastAttemptTime, completionTime, errorMessage, result);
            
            // Set ODR fields
            transaction.setOdrOperation(odrOperation);
            transaction.setCosemObjects(cosemObjects);
            transaction.setOdrRequestId(odrRequestId);
            transaction.setOdrRequestTime(odrRequestTime);
            transaction.setOdrResponseData(odrResponseData);
            
            return transaction;
        }
    }
} 