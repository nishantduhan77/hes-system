package com.hes.collector.service;

import com.hes.collector.model.MeterTransaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class MeterTransactionManager {
    private final Map<UUID, MeterTransaction> activeTransactions;
    private final ScheduledExecutorService scheduler;
    
    public MeterTransactionManager() {
        this.activeTransactions = new ConcurrentHashMap<>();
        this.scheduler = Executors.newScheduledThreadPool(1);
        startTimeoutChecker();
    }

    public MeterTransaction createTransaction(String meterSerialNumber, MeterTransaction.TransactionType type) {
        MeterTransaction transaction = MeterTransaction.builder()
            .transactionId(UUID.randomUUID())
            .meterSerialNumber(meterSerialNumber)
            .type(type)
            .status(MeterTransaction.TransactionStatus.INITIATED)
            .retryCount(0)
            .startTime(Instant.now())
            .lastAttemptTime(Instant.now())
            .build();

        activeTransactions.put(transaction.getTransactionId(), transaction);
        log.info("Created new transaction: {} for meter: {}", transaction.getTransactionId(), meterSerialNumber);
        return transaction;
    }

    public void updateTransactionStatus(UUID transactionId, MeterTransaction.TransactionStatus status, String errorMessage) {
        MeterTransaction transaction = activeTransactions.get(transactionId);
        if (transaction != null) {
            transaction.setStatus(status);
            transaction.setLastAttemptTime(Instant.now());
            if (errorMessage != null) {
                transaction.setErrorMessage(errorMessage);
            }
            
            if (transaction.isComplete()) {
                transaction.setCompletionTime(Instant.now());
                activeTransactions.remove(transactionId);
                log.info("Transaction completed: {} with status: {}", transactionId, status);
            } else {
                log.info("Updated transaction: {} status to: {}", transactionId, status);
            }
        }
    }

    public void setTransactionResult(UUID transactionId, MeterTransaction.Result result) {
        MeterTransaction transaction = activeTransactions.get(transactionId);
        if (transaction != null) {
            transaction.setResult(result);
            updateTransactionStatus(transactionId, MeterTransaction.TransactionStatus.COMPLETED, null);
        }
    }

    public boolean retryTransaction(UUID transactionId) {
        MeterTransaction transaction = activeTransactions.get(transactionId);
        if (transaction != null && transaction.canRetry()) {
            transaction.setRetryCount(transaction.getRetryCount() + 1);
            transaction.setStatus(MeterTransaction.TransactionStatus.RETRY);
            transaction.setLastAttemptTime(Instant.now());
            log.info("Retrying transaction: {} attempt: {}", transactionId, transaction.getRetryCount());
            return true;
        }
        return false;
    }

    public MeterTransaction getTransaction(UUID transactionId) {
        return activeTransactions.get(transactionId);
    }

    private void startTimeoutChecker() {
        scheduler.scheduleAtFixedRate(() -> {
            Instant now = Instant.now();
            activeTransactions.forEach((id, transaction) -> {
                if (!transaction.isComplete() && 
                    now.isAfter(transaction.getStartTime().plusSeconds(120))) {
                    updateTransactionStatus(id, MeterTransaction.TransactionStatus.TIMEOUT, 
                        "Transaction timed out after 120 seconds");
                }
            });
        }, 30, 30, TimeUnit.SECONDS);
    }
} 