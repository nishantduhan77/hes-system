"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HDLCLayer_1 = require("../transport/HDLCLayer");
const HDLCFrame_1 = require("../transport/HDLCFrame");
const test_utils_1 = require("./test-utils");
describe('HDLCLayer', () => {
    const testConfig = {
        windowSize: 1,
        maxInfoLength: 128,
        responseTimeout: 1000,
        interFrameTimeout: 100,
        inactivityTimeout: 5000,
        serverAddress: { upper: 1, lower: 1 },
        clientAddress: { upper: 2, lower: 2 }
    };
    let hdlcLayer;
    beforeEach(() => {
        hdlcLayer = new HDLCLayer_1.HDLCLayer(testConfig);
    });
    describe('state management', () => {
        it('should start in disconnected state', () => {
            expect(hdlcLayer.getState()).toBe(HDLCLayer_1.HDLCState.DISCONNECTED);
        });
        it('should transition to connecting state during connect', async () => {
            const connectPromise = hdlcLayer.connect();
            expect(hdlcLayer.getState()).toBe(HDLCLayer_1.HDLCState.CONNECTING);
            // Simulate UA response
            const frame = new HDLCFrame_1.HDLCFrame(3, HDLCFrame_1.FrameType.UA, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
            await connectPromise;
            expect(hdlcLayer.getState()).toBe(HDLCLayer_1.HDLCState.CONNECTED);
        });
        it('should handle connection timeout', async () => {
            const connectPromise = hdlcLayer.connect();
            await (0, test_utils_1.wait)(testConfig.responseTimeout + 100);
            await expect(connectPromise).rejects.toThrow('Response timeout');
            expect(hdlcLayer.getState()).toBe(HDLCLayer_1.HDLCState.DISCONNECTED);
        });
    });
    describe('frame handling', () => {
        beforeEach(async () => {
            // Connect before testing frame handling
            const connectPromise = hdlcLayer.connect();
            const frame = new HDLCFrame_1.HDLCFrame(3, HDLCFrame_1.FrameType.UA, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
            await connectPromise;
        });
        it('should send and receive information frames', async () => {
            const testData = (0, test_utils_1.createTestBuffer)(64);
            const sendPromise = hdlcLayer.sendData(testData);
            // Simulate RR response
            const frame = new HDLCFrame_1.HDLCFrame(2, HDLCFrame_1.FrameType.RR, testConfig.serverAddress, testConfig.clientAddress, Buffer.alloc(0), 0, 1);
            hdlcLayer.handleFrame(frame);
            await sendPromise;
        });
        it('should handle receive ready frames', () => {
            const frame = new HDLCFrame_1.HDLCFrame(2, HDLCFrame_1.FrameType.RR, testConfig.serverAddress, testConfig.clientAddress, Buffer.alloc(0), 0, 1);
            hdlcLayer.handleFrame(frame);
            // Should not throw
        });
        it('should handle receive not ready frames', () => {
            const frame = new HDLCFrame_1.HDLCFrame(2, HDLCFrame_1.FrameType.RNR, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
            // Should not throw
        });
        it('should handle reject frames', () => {
            const frame = new HDLCFrame_1.HDLCFrame(2, HDLCFrame_1.FrameType.REJ, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
            // Should not throw
        });
    });
    describe('disconnection', () => {
        beforeEach(async () => {
            // Connect before testing disconnection
            const connectPromise = hdlcLayer.connect();
            const frame = new HDLCFrame_1.HDLCFrame(3, HDLCFrame_1.FrameType.UA, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
            await connectPromise;
        });
        it('should handle normal disconnection', async () => {
            const disconnectPromise = hdlcLayer.disconnect();
            // Simulate UA response
            const frame = new HDLCFrame_1.HDLCFrame(3, HDLCFrame_1.FrameType.UA, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
            await disconnectPromise;
            expect(hdlcLayer.getState()).toBe(HDLCLayer_1.HDLCState.DISCONNECTED);
        });
        it('should handle disconnected mode frames', () => {
            const frame = new HDLCFrame_1.HDLCFrame(3, HDLCFrame_1.FrameType.DM, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
            expect(hdlcLayer.getState()).toBe(HDLCLayer_1.HDLCState.DISCONNECTED);
        });
        it('should handle frame reject frames', () => {
            const frame = new HDLCFrame_1.HDLCFrame(3, HDLCFrame_1.FrameType.FRMR, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
            // Should not throw
        });
    });
    describe('event handling', () => {
        it('should emit connected event', (done) => {
            hdlcLayer.on('connected', () => {
                expect(hdlcLayer.getState()).toBe(HDLCLayer_1.HDLCState.CONNECTED);
                done();
            });
            const connectPromise = hdlcLayer.connect();
            const frame = new HDLCFrame_1.HDLCFrame(3, HDLCFrame_1.FrameType.UA, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
        });
        it('should emit disconnected event', (done) => {
            hdlcLayer.on('disconnected', () => {
                expect(hdlcLayer.getState()).toBe(HDLCLayer_1.HDLCState.DISCONNECTED);
                done();
            });
            const frame = new HDLCFrame_1.HDLCFrame(3, HDLCFrame_1.FrameType.DM, testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
        });
        it('should emit error event', (done) => {
            hdlcLayer.on('error', (error) => {
                expect(error).toBeInstanceOf(Error);
                done();
            });
            // Simulate invalid frame handling
            const frame = new HDLCFrame_1.HDLCFrame(3, 99, // Invalid frame type
            testConfig.serverAddress, testConfig.clientAddress);
            hdlcLayer.handleFrame(frame);
        });
    });
});
