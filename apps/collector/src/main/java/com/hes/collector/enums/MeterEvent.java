package com.hes.collector.enums;

import lombok.Getter;

@Getter
public enum MeterEvent {
    PING_SUCCESS(1, "Ping successful"),
    PING_FAILED(2, "Ping failed"),
    RELAY_CONNECTED(3, "Relay connected"),
    RELAY_DISCONNECTED(4, "Relay disconnected"),
    RELAY_OPERATION_FAILED(5, "Relay operation failed"),
    CONNECTION_ESTABLISHED(6, "Connection established"),
    CONNECTION_FAILED(7, "Connection failed"),
    DATA_READ_SUCCESS(8, "Data read successful"),
    DATA_READ_FAILED(9, "Data read failed"),
    DATA_WRITE_SUCCESS(10, "Data write successful"),
    DATA_WRITE_FAILED(11, "Data write failed");

    private final int eventId;
    private final String description;

    MeterEvent(int eventId, String description) {
        this.eventId = eventId;
        this.description = description;
    }

    public int getEventId() {
        return eventId;
    }

    public String getDescription() {
        return description;
    }

    public String getEventName() {
        return this.name();
    }
} 