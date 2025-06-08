package com.hes.console.shell;

import com.hes.console.DlmsClient;
import com.hes.shared.model.Meter;
import com.hes.shared.model.MeterReading;
import lombok.RequiredArgsConstructor;
import org.springframework.shell.standard.ShellComponent;
import org.springframework.shell.standard.ShellMethod;
import org.springframework.shell.standard.ShellOption;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@ShellComponent
@RequiredArgsConstructor
public class MeterCommands {
    private final DlmsClient dlmsClient;
    private final ConcurrentHashMap<String, Meter> meters = new ConcurrentHashMap<>();

    @ShellMethod(key = "meter-add", value = "Add a new meter")
    public String addMeter(
            @ShellOption(value = "-i", help = "Meter ID") String meterId,
            @ShellOption(value = "-s", help = "Serial Number") String serialNumber,
            @ShellOption(value = "-m", help = "Manufacturer Name") String manufacturer,
            @ShellOption(value = "-a", help = "IP Address") String ipAddress,
            @ShellOption(value = "-p", help = "Port", defaultValue = "4059") Integer port
    ) {
        Meter meter = new Meter();
        meter.setMeterId(meterId);
        meter.setSerialNumber(serialNumber);
        meter.setManufacturerName(manufacturer);
        meter.setIpAddress(ipAddress);
        meter.setPort(port);
        meter.setLastReadTime(LocalDateTime.now());
        meter.setStatus("REGISTERED");
        
        meters.put(meterId, meter);
        return String.format("Meter added successfully: %s", meterId);
    }

    @ShellMethod(key = "meter-list", value = "List all meters")
    public String listMeters() {
        if (meters.isEmpty()) {
            return "No meters registered";
        }

        StringBuilder result = new StringBuilder();
        result.append("Registered Meters:\n");
        result.append(String.format("%-20s %-20s %-20s %-15s %-10s %-10s\n", 
            "Meter ID", "Serial Number", "Manufacturer", "IP Address", "Port", "Status"));
        result.append("-".repeat(95)).append("\n");

        meters.values().forEach(meter -> {
            result.append(String.format("%-20s %-20s %-20s %-15s %-10d %-10s\n",
                meter.getMeterId(),
                meter.getSerialNumber(),
                meter.getManufacturerName(),
                meter.getIpAddress(),
                meter.getPort(),
                meter.getStatus()
            ));
        });

        return result.toString();
    }

    @ShellMethod(key = "meter-connect", value = "Connect to a meter")
    public String connectMeter(@ShellOption(value = "-i", help = "Meter ID") String meterId) {
        Meter meter = meters.get(meterId);
        if (meter == null) {
            return "Meter not found: " + meterId;
        }

        try {
            dlmsClient.connect(meter);
            meter.setConnected(true);
            meter.setStatus("CONNECTED");
            meters.put(meterId, meter);
            return "Successfully connected to meter: " + meterId;
        } catch (Exception e) {
            return "Failed to connect to meter: " + e.getMessage();
        }
    }

    @ShellMethod(key = "meter-read", value = "Read meter data")
    public String readMeter(@ShellOption(value = "-i", help = "Meter ID") String meterId) {
        Meter meter = meters.get(meterId);
        if (meter == null) {
            return "Meter not found: " + meterId;
        }

        if (!meter.isConnected()) {
            return "Meter is not connected. Please connect first using meter-connect command.";
        }

        try {
            MeterReading reading = dlmsClient.readMeterData(meterId);
            return formatMeterReading(reading);
        } catch (Exception e) {
            return "Failed to read meter data: " + e.getMessage();
        }
    }

    @ShellMethod(key = "meter-disconnect", value = "Disconnect from a meter")
    public String disconnectMeter(@ShellOption(value = "-i", help = "Meter ID") String meterId) {
        Meter meter = meters.get(meterId);
        if (meter == null) {
            return "Meter not found: " + meterId;
        }

        try {
            dlmsClient.disconnect(meterId);
            meter.setConnected(false);
            meter.setStatus("DISCONNECTED");
            meters.put(meterId, meter);
            return "Successfully disconnected from meter: " + meterId;
        } catch (Exception e) {
            return "Failed to disconnect from meter: " + e.getMessage();
        }
    }

    private String formatMeterReading(MeterReading reading) {
        StringBuilder result = new StringBuilder();
        result.append("Meter Reading:\n");
        result.append("-".repeat(50)).append("\n");
        result.append(String.format("Meter ID: %s\n", reading.getMeterId()));
        result.append(String.format("Timestamp: %s\n", reading.getTimestamp()));
        result.append(String.format("Active Energy Import: %.2f kWh\n", reading.getActiveEnergyImport()));
        result.append(String.format("Voltage: %.1f V\n", reading.getVoltage()));
        result.append(String.format("Frequency: %.1f Hz\n", reading.getFrequency()));
        result.append(String.format("Status: %s\n", reading.getStatus()));
        result.append("-".repeat(50));
        return result.toString();
    }
} 