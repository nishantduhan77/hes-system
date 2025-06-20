package com.hes.collector.dlms;

import lombok.extern.slf4j.Slf4j;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.util.Arrays;

@Slf4j
public class TcpConnection implements DlmsConnection {
    private static final int WRAPPER_LENGTH = 8;
    private static final int VERSION = 1;
    private static final int MAX_BUFFER_SIZE = 2048;

    private final Socket socket;
    private final InputStream in;
    private final OutputStream out;
    private final byte[] buffer;

    public TcpConnection(Socket socket) throws IOException {
        this.socket = socket;
        this.in = socket.getInputStream();
        this.out = socket.getOutputStream();
        this.buffer = new byte[MAX_BUFFER_SIZE];
    }

    @Override
    public boolean establish() {
        // TCP connection is already established
        return true;
    }

    @Override
    public void disconnect() {
        try {
            if (!socket.isClosed()) {
                socket.close();
            }
        } catch (IOException e) {
            log.error("Error closing TCP connection: {}", e.getMessage());
        }
    }

    @Override
    public byte[] send(byte[] data) throws IOException {
        // Create DLMS wrapper
        byte[] wrapper = createWrapper(data);
        
        // Send data
        out.write(wrapper);
        out.flush();

        // Read response
        return readResponse();
    }

    private byte[] createWrapper(byte[] data) {
        int length = data.length + WRAPPER_LENGTH;
        byte[] wrapper = new byte[length];

        // Version
        wrapper[0] = VERSION;
        wrapper[1] = VERSION;

        // Length (big endian)
        wrapper[2] = (byte) ((length >> 8) & 0xFF);
        wrapper[3] = (byte) (length & 0xFF);

        // Source and destination addresses
        wrapper[4] = 0x00;
        wrapper[5] = 0x01;
        wrapper[6] = 0x00;
        wrapper[7] = 0x01;

        // Copy data
        System.arraycopy(data, 0, wrapper, WRAPPER_LENGTH, data.length);

        return wrapper;
    }

    private byte[] readResponse() throws IOException {
        // Read header
        int headerRead = in.read(buffer, 0, WRAPPER_LENGTH);
        if (headerRead != WRAPPER_LENGTH) {
            throw new IOException("Failed to read DLMS wrapper header");
        }

        // Get length from header
        int length = ((buffer[2] & 0xFF) << 8) | (buffer[3] & 0xFF);
        int dataLength = length - WRAPPER_LENGTH;

        if (dataLength <= 0 || dataLength > MAX_BUFFER_SIZE - WRAPPER_LENGTH) {
            throw new IOException("Invalid DLMS wrapper length: " + dataLength);
        }

        // Read data
        int dataRead = in.read(buffer, WRAPPER_LENGTH, dataLength);
        if (dataRead != dataLength) {
            throw new IOException("Failed to read complete DLMS data");
        }

        // Return data without wrapper
        return Arrays.copyOfRange(buffer, WRAPPER_LENGTH, length);
    }
} 