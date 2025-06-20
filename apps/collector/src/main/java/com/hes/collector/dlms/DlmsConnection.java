package com.hes.collector.dlms;

import java.io.IOException;

/**
 * Interface for DLMS/COSEM communication layer
 */
public interface DlmsConnection {
    /**
     * Establishes the connection
     * @return true if connection was established successfully
     */
    boolean establish();

    /**
     * Disconnects and releases resources
     */
    void disconnect();

    /**
     * Sends data and receives response
     * @param data data to send
     * @return response data
     * @throws IOException if communication error occurs
     */
    byte[] send(byte[] data) throws IOException;
} 