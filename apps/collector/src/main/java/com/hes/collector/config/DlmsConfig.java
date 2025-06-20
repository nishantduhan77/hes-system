package com.hes.collector.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "dlms")
public class DlmsConfig {
    private int readTimeoutMs = 5000;
    private int connectTimeoutMs = 10000;
    private int maxRetries = 3;
    private boolean useHdlc = true;
    private int clientId = 1;
    private int serverLowerMacAddress = 17;
    private int serverUpperMacAddress = 0;
    private String authenticationKey;
    private String encryptionKey;
    private String systemTitle;
    private boolean useHighLevelSecurity = false;
    private int maxPduSize = 1024;
    private int windowSize = 1;
    private int maxInfoLength = 128;
    private boolean useCompression = false;
    private int associationTimeout = 120000;
    private int releaseTimeout = 5000;
    private int frameTimeout = 1000;
    private int inactivityTimeout = 180000;
    private int keepAliveInterval = 60000;
} 