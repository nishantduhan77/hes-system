package com.hes.microservice.controller;

import com.hes.shared.model.Meter;
import com.hes.shared.model.MeterReading;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/meters")
@RequiredArgsConstructor
public class MeterController {
    private final ConcurrentHashMap<String, Meter> meters = new ConcurrentHashMap<>();

    @PostMapping
    public ResponseEntity<Meter> registerMeter(@RequestBody Meter meter) {
        meters.put(meter.getMeterId(), meter);
        return ResponseEntity.ok(meter);
    }

    @GetMapping
    public ResponseEntity<List<Meter>> getAllMeters() {
        return ResponseEntity.ok(meters.values().stream().toList());
    }

    @GetMapping("/{meterId}")
    public ResponseEntity<Meter> getMeter(@PathVariable String meterId) {
        Meter meter = meters.get(meterId);
        if (meter == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(meter);
    }

    @PostMapping("/{meterId}/readings")
    public ResponseEntity<Void> submitReading(
            @PathVariable String meterId,
            @RequestBody MeterReading reading) {
        if (!meters.containsKey(meterId)) {
            return ResponseEntity.notFound().build();
        }
        // TODO: Process and store the reading
        // TODO: Send to Kafka topic
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{meterId}")
    public ResponseEntity<Void> deleteMeter(@PathVariable String meterId) {
        if (meters.remove(meterId) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().build();
    }
} 