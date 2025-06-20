package com.hes.collector.service;

import com.hes.collector.model.MeterTransaction;
import com.hes.collector.model.Meter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class RealTimeMeterCommunicationService {
    private final MeterTransactionManager transactionManager;
    private final MeterService meterService;
    private final DlmsMeterCommunicationService dlmsService;

    public RealTimeMeterCommunicationService(
            MeterTransactionManager transactionManager, 
            MeterService meterService,
            DlmsMeterCommunicationService dlmsService) {
        this.transactionManager = transactionManager;
        this.meterService = meterService;
        this.dlmsService = dlmsService;
    }

    public CompletableFuture<MeterTransaction> pingMeter(String meterSerialNumber) {
        MeterTransaction transaction = transactionManager.createTransaction(
            meterSerialNumber, 
            MeterTransaction.TransactionType.PING
        );

        return CompletableFuture.supplyAsync(() -> {
            try {
                Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
                if (meter == null) {
                    transactionManager.updateTransactionStatus(
                        transaction.getTransactionId(),
                        MeterTransaction.TransactionStatus.FAILED,
                        "Meter not found"
                    );
                    return transaction;
                }

                boolean success = dlmsService.executePingCommand(meter);
                
                if (success) {
                    MeterTransaction.Result result = new MeterTransaction.Result();
                    result.setSuccess(true);
                    result.setTimestamp(java.time.Instant.now());
                    transactionManager.setTransactionResult(
                        transaction.getTransactionId(),
                        result
                    );
                } else {
                    handleFailedTransaction(transaction.getTransactionId(), "Ping failed");
                }
            } catch (Exception e) {
                handleFailedTransaction(transaction.getTransactionId(), e.getMessage());
            }
            return transactionManager.getTransaction(transaction.getTransactionId());
        });
    }

    public CompletableFuture<MeterTransaction> getRelayStatus(String meterSerialNumber) {
        MeterTransaction transaction = transactionManager.createTransaction(
            meterSerialNumber, 
            MeterTransaction.TransactionType.READ
        );

        return CompletableFuture.supplyAsync(() -> {
            try {
                Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
                if (meter == null) {
                    transactionManager.updateTransactionStatus(
                        transaction.getTransactionId(),
                        MeterTransaction.TransactionStatus.FAILED,
                        "Meter not found"
                    );
                    return transaction;
                }

                // Get relay status through DLMS
                boolean success = dlmsService.executeRelayCommand(meter, false); // false = just read status
                
                if (success) {
                    MeterTransaction.Result result = new MeterTransaction.Result();
                    result.setSuccess(true);
                    result.setTimestamp(java.time.Instant.now());
                    transactionManager.setTransactionResult(
                        transaction.getTransactionId(),
                        result
                    );
                } else {
                    handleFailedTransaction(transaction.getTransactionId(), "Failed to get relay status");
                }
            } catch (Exception e) {
                handleFailedTransaction(transaction.getTransactionId(), e.getMessage());
            }
            return transactionManager.getTransaction(transaction.getTransactionId());
        });
    }

    public CompletableFuture<MeterTransaction> connectMeter(String meterSerialNumber) {
        MeterTransaction transaction = transactionManager.createTransaction(
            meterSerialNumber, 
            MeterTransaction.TransactionType.CONNECT
        );

        return CompletableFuture.supplyAsync(() -> {
            try {
                Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
                if (meter == null) {
                    transactionManager.updateTransactionStatus(
                        transaction.getTransactionId(),
                        MeterTransaction.TransactionStatus.FAILED,
                        "Meter not found"
                    );
                    return transaction;
                }

                boolean success = dlmsService.executeRelayCommand(meter, true); // true = connect
                
                if (success) {
                    MeterTransaction.Result result = new MeterTransaction.Result();
                    result.setSuccess(true);
                    result.setTimestamp(java.time.Instant.now());
                    transactionManager.setTransactionResult(
                        transaction.getTransactionId(),
                        result
                    );
                } else {
                    handleFailedTransaction(transaction.getTransactionId(), "Failed to connect meter");
                }
            } catch (Exception e) {
                handleFailedTransaction(transaction.getTransactionId(), e.getMessage());
            }
            return transactionManager.getTransaction(transaction.getTransactionId());
        });
    }

    public CompletableFuture<MeterTransaction> disconnectMeter(String meterSerialNumber) {
        MeterTransaction transaction = transactionManager.createTransaction(
            meterSerialNumber, 
            MeterTransaction.TransactionType.DISCONNECT
        );

        return CompletableFuture.supplyAsync(() -> {
            try {
                Meter meter = meterService.getMeterBySerialNumber(meterSerialNumber);
                if (meter == null) {
                    transactionManager.updateTransactionStatus(
                        transaction.getTransactionId(),
                        MeterTransaction.TransactionStatus.FAILED,
                        "Meter not found"
                    );
                    return transaction;
                }

                boolean success = dlmsService.executeRelayCommand(meter, false); // false = disconnect
                
                if (success) {
                    MeterTransaction.Result result = new MeterTransaction.Result();
                    result.setSuccess(true);
                    result.setTimestamp(java.time.Instant.now());
                    transactionManager.setTransactionResult(
                        transaction.getTransactionId(),
                        result
                    );
                } else {
                    handleFailedTransaction(transaction.getTransactionId(), "Failed to disconnect meter");
                }
            } catch (Exception e) {
                handleFailedTransaction(transaction.getTransactionId(), e.getMessage());
            }
            return transactionManager.getTransaction(transaction.getTransactionId());
        });
    }

    private void handleFailedTransaction(UUID transactionId, String errorMessage) {
        if (transactionManager.retryTransaction(transactionId)) {
            log.info("Retrying transaction: {}", transactionId);
        } else {
            transactionManager.updateTransactionStatus(
                transactionId,
                MeterTransaction.TransactionStatus.FAILED,
                errorMessage
            );
        }
    }
} 