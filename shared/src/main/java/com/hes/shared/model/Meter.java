package com.hes.shared.model;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class Meter {
    @NotBlank
    private String meterId;
    
    @NotBlank
    private String serialNumber;
    
    @NotBlank
    private String manufacturerName;
    
    private String modelName;
    
    @NotNull
    private LocalDateTime lastReadTime;
    
    private String ipAddress;
    private Integer port;
    
    private boolean connected;
    private String status;
    
    // DLMS/COSEM specific attributes
    private String clientAddress;
    private String logicalDeviceAddress;
    private String authenticationKey;
    private String encryptionKey;
} 