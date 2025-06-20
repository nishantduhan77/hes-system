package com.hes.collector.controller;

import com.hes.collector.model.MeterTransaction;
import com.hes.collector.service.RealTimeMeterCommunicationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/meters")
public class MeterCommandController {
    private final RealTimeMeterCommunicationService communicationService;

    public MeterCommandController(RealTimeMeterCommunicationService communicationService) {
        this.communicationService = communicationService;
    }

    @GetMapping("/{meterSerialNumber}/ping")
    public CompletableFuture<ResponseEntity<MeterTransaction>> pingMeter(
            @PathVariable String meterSerialNumber) {
        log.info("Received ping request for meter: {}", meterSerialNumber);
        return communicationService.pingMeter(meterSerialNumber)
            .thenApply(transaction -> ResponseEntity.ok(transaction));
    }

    @GetMapping("/{meterSerialNumber}/relay-status")
    public CompletableFuture<ResponseEntity<MeterTransaction>> getRelayStatus(
            @PathVariable String meterSerialNumber) {
        log.info("Received relay status request for meter: {}", meterSerialNumber);
        return communicationService.getRelayStatus(meterSerialNumber)
            .thenApply(transaction -> ResponseEntity.ok(transaction));
    }

    @PostMapping("/{meterSerialNumber}/connect")
    public CompletableFuture<ResponseEntity<MeterTransaction>> connectMeter(
            @PathVariable String meterSerialNumber) {
        log.info("Received connect request for meter: {}", meterSerialNumber);
        return communicationService.connectMeter(meterSerialNumber)
            .thenApply(transaction -> ResponseEntity.ok(transaction));
    }

    @PostMapping("/{meterSerialNumber}/disconnect")
    public CompletableFuture<ResponseEntity<MeterTransaction>> disconnectMeter(
            @PathVariable String meterSerialNumber) {
        log.info("Received disconnect request for meter: {}", meterSerialNumber);
        return communicationService.disconnectMeter(meterSerialNumber)
            .thenApply(transaction -> ResponseEntity.ok(transaction));
    }
} 