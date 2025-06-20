package com.hes.collector.dlms;

import com.hes.collector.config.DlmsConfig;
import com.hes.collector.dlms.security.SecuritySuite;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import java.io.IOException;
import java.net.Socket;
import java.time.Instant;

@Slf4j
@Builder
public class DlmsProtocol implements AutoCloseable {
    private final String ipAddress;
    private final int port;
    private final DlmsConfig config;
    private final SecuritySuite security;
    private Socket socket;
    private HdlcConnection hdlcConnection;
    private CosemAssociation association;
    private boolean isConnected;

    public boolean connect() {
        try {
            // Establish TCP connection
            socket = new Socket(ipAddress, port);
            socket.setSoTimeout(config.getReadTimeoutMs());

            if (config.isUseHdlc()) {
                // Initialize HDLC connection
                hdlcConnection = new HdlcConnection(socket, config);
                if (!hdlcConnection.establish()) {
                    log.error("Failed to establish HDLC connection");
                    return false;
                }
            }

            // Create COSEM association
            association = new CosemAssociation(
                hdlcConnection != null ? hdlcConnection : new TcpConnection(socket),
                security,
                config
            );

            // Perform association
            isConnected = association.associate();
            if (!isConnected) {
                log.error("Failed to establish COSEM association");
                return false;
            }

            log.info("Successfully established DLMS connection to {}:{}", ipAddress, port);
            return true;
        } catch (IOException e) {
            log.error("Failed to establish DLMS connection: {}", e.getMessage());
            close();
            return false;
        }
    }

    public boolean disconnect() {
        try {
            if (association != null) {
                association.release();
            }
            if (hdlcConnection != null) {
                hdlcConnection.disconnect();
            }
            if (socket != null && !socket.isClosed()) {
                socket.close();
            }
            isConnected = false;
            return true;
        } catch (Exception e) {
            log.error("Error during DLMS disconnect: {}", e.getMessage());
            return false;
        }
    }

    public GetResult get(CosemObject object) {
        try {
            if (!isConnected) {
                log.error("Not connected to meter");
                return GetResult.builder()
                    .success(false)
                    .error("Not connected to meter")
                    .build();
            }

            return association.get(object);
        } catch (Exception e) {
            log.error("Error during DLMS get: {}", e.getMessage());
            return GetResult.builder()
                .success(false)
                .error(e.getMessage())
                .build();
        }
    }

    public SetResult set(CosemObject object, DataObject value) {
        try {
            if (!isConnected) {
                log.error("Not connected to meter");
                return SetResult.builder()
                    .success(false)
                    .error("Not connected to meter")
                    .build();
            }

            return association.set(object, value);
        } catch (Exception e) {
            log.error("Error during DLMS set: {}", e.getMessage());
            return SetResult.builder()
                .success(false)
                .error(e.getMessage())
                .build();
        }
    }

    @Override
    public void close() {
        disconnect();
    }

    @Builder
    public static class GetResult {
        private final boolean success;
        private final DataObject value;
        private final String error;
        private final Instant timestamp;

        public boolean isSuccess() {
            return success;
        }

        public DataObject getValue() {
            return value;
        }

        public String getError() {
            return error;
        }

        public Instant getTimestamp() {
            return timestamp;
        }
    }

    @Builder
    public static class SetResult {
        private final boolean success;
        private final String error;
        private final Instant timestamp;

        public boolean isSuccess() {
            return success;
        }

        public String getError() {
            return error;
        }

        public Instant getTimestamp() {
            return timestamp;
        }
    }
} 