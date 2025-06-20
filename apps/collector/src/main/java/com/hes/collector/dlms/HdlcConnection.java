package com.hes.collector.dlms;

import com.hes.collector.config.DlmsConfig;
import lombok.extern.slf4j.Slf4j;
import java.io.*;
import java.net.Socket;
import java.util.Arrays;

@Slf4j
public class HdlcConnection implements DlmsConnection {
    private static final byte FLAG = (byte) 0x7E;
    private static final byte FORMAT_TYPE = (byte) 0xA0;
    private static final int MAX_INFO_LENGTH = 128;
    
    private final Socket socket;
    private final DlmsConfig config;
    private final InputStream in;
    private final OutputStream out;
    private byte[] buffer;
    private int sequenceNumber;

    public HdlcConnection(Socket socket, DlmsConfig config) throws IOException {
        this.socket = socket;
        this.config = config;
        this.in = socket.getInputStream();
        this.out = socket.getOutputStream();
        this.buffer = new byte[MAX_INFO_LENGTH * 2];
        this.sequenceNumber = 0;
    }

    @Override
    public boolean establish() {
        try {
            // Send SNRM (Set Normal Response Mode)
            byte[] snrm = createSnrmFrame();
            out.write(snrm);
            out.flush();

            // Wait for UA (Unnumbered Acknowledgement)
            byte[] response = readFrame();
            if (!isUaFrame(response)) {
                log.error("Invalid response to SNRM");
                return false;
            }

            log.info("HDLC connection established");
            return true;
        } catch (IOException e) {
            log.error("Failed to establish HDLC connection: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void disconnect() {
        try {
            // Send DISC (Disconnect)
            byte[] disc = createDiscFrame();
            out.write(disc);
            out.flush();

            // Wait for UA
            byte[] response = readFrame();
            if (!isUaFrame(response)) {
                log.warn("Invalid response to DISC");
            }
        } catch (IOException e) {
            log.error("Error during HDLC disconnect: {}", e.getMessage());
        }
    }

    @Override
    public byte[] send(byte[] data) throws IOException {
        // Create I-frame with data
        byte[] frame = createIFrame(data);
        out.write(frame);
        out.flush();

        // Read response
        return readFrame();
    }

    private byte[] createSnrmFrame() {
        byte[] frame = new byte[8];
        frame[0] = FLAG;
        frame[1] = FORMAT_TYPE;
        frame[2] = (byte) (config.getServerLowerMacAddress() & 0xFF);
        frame[3] = (byte) (config.getClientId() & 0xFF);
        frame[4] = (byte) 0x93; // SNRM control field
        frame[5] = (byte) 0x00; // No information field
        // Add FCS (Frame Check Sequence)
        byte[] fcs = calculateFcs(Arrays.copyOfRange(frame, 1, 5));
        frame[6] = fcs[0];
        frame[7] = FLAG;
        return frame;
    }

    private byte[] createDiscFrame() {
        byte[] frame = new byte[8];
        frame[0] = FLAG;
        frame[1] = FORMAT_TYPE;
        frame[2] = (byte) (config.getServerLowerMacAddress() & 0xFF);
        frame[3] = (byte) (config.getClientId() & 0xFF);
        frame[4] = (byte) 0x53; // DISC control field
        frame[5] = (byte) 0x00; // No information field
        byte[] fcs = calculateFcs(Arrays.copyOfRange(frame, 1, 5));
        frame[6] = fcs[0];
        frame[7] = FLAG;
        return frame;
    }

    private byte[] createIFrame(byte[] data) {
        int frameLength = data.length + 8;
        byte[] frame = new byte[frameLength];
        frame[0] = FLAG;
        frame[1] = FORMAT_TYPE;
        frame[2] = (byte) (config.getServerLowerMacAddress() & 0xFF);
        frame[3] = (byte) (config.getClientId() & 0xFF);
        frame[4] = (byte) ((sequenceNumber << 1) & 0xFF); // Control field for I-frame
        System.arraycopy(data, 0, frame, 5, data.length);
        byte[] fcs = calculateFcs(Arrays.copyOfRange(frame, 1, frameLength - 2));
        frame[frameLength - 2] = fcs[0];
        frame[frameLength - 1] = FLAG;
        sequenceNumber = (sequenceNumber + 1) % 8;
        return frame;
    }

    private byte[] readFrame() throws IOException {
        int length = 0;
        boolean started = false;

        while (true) {
            int b = in.read();
            if (b == -1) {
                throw new IOException("End of stream");
            }

            if (b == FLAG) {
                if (!started) {
                    started = true;
                    continue;
                } else {
                    break;
                }
            }

            if (started) {
                buffer[length++] = (byte) b;
            }
        }

        return Arrays.copyOfRange(buffer, 0, length);
    }

    private boolean isUaFrame(byte[] frame) {
        return frame.length >= 5 && (frame[4] & 0xEF) == 0x63;
    }

    private byte[] calculateFcs(byte[] data) {
        int fcs = 0xFFFF;
        for (byte b : data) {
            fcs = (fcs >> 8) ^ fcTable[(fcs ^ b) & 0xFF];
        }
        fcs = ~fcs;
        return new byte[] { (byte) (fcs & 0xFF), (byte) ((fcs >> 8) & 0xFF) };
    }

    // FCS lookup table
    private static final byte[] fcTable = {
        (byte)0x00, (byte)0x89, (byte)0x12, (byte)0x9B, (byte)0x24, (byte)0xAD, (byte)0x36, (byte)0xBF,
        // ... (full table omitted for brevity)
        (byte)0x6E, (byte)0xE7, (byte)0x7E, (byte)0xF7, (byte)0x4A, (byte)0xC3, (byte)0x5A, (byte)0xD3
    };
} 