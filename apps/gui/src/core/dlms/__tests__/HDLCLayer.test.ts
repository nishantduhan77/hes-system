import { HDLCLayer, HDLCState, HDLCConfig } from '../transport/HDLCLayer';
import { HDLCFrame, FrameType } from '../transport/HDLCFrame';
import { createTestBuffer, wait } from './test-utils';

describe('HDLCLayer', () => {
    const testConfig: HDLCConfig = {
        windowSize: 1,
        maxInfoLength: 128,
        responseTimeout: 1000,
        interFrameTimeout: 100,
        inactivityTimeout: 5000,
        serverAddress: { upper: 1, lower: 1 },
        clientAddress: { upper: 2, lower: 2 }
    };

    let hdlcLayer: HDLCLayer;

    beforeEach(() => {
        hdlcLayer = new HDLCLayer(testConfig);
    });

    describe('state management', () => {
        it('should start in disconnected state', () => {
            expect(hdlcLayer.getState()).toBe(HDLCState.DISCONNECTED);
        });

        it('should transition to connecting state during connect', async () => {
            const connectPromise = hdlcLayer.connect();
            expect(hdlcLayer.getState()).toBe(HDLCState.CONNECTING);
            
            // Simulate UA response
            const frame = new HDLCFrame(
                3,
                FrameType.UA,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
            
            await connectPromise;
            expect(hdlcLayer.getState()).toBe(HDLCState.CONNECTED);
        });

        it('should handle connection timeout', async () => {
            const connectPromise = hdlcLayer.connect();
            await wait(testConfig.responseTimeout + 100);
            await expect(connectPromise).rejects.toThrow('Response timeout');
            expect(hdlcLayer.getState()).toBe(HDLCState.DISCONNECTED);
        });
    });

    describe('frame handling', () => {
        beforeEach(async () => {
            // Connect before testing frame handling
            const connectPromise = hdlcLayer.connect();
            const frame = new HDLCFrame(
                3,
                FrameType.UA,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
            await connectPromise;
        });

        it('should send and receive information frames', async () => {
            const testData = createTestBuffer(64);
            const sendPromise = hdlcLayer.sendData(testData);

            // Simulate RR response
            const frame = new HDLCFrame(
                2,
                FrameType.RR,
                testConfig.serverAddress,
                testConfig.clientAddress,
                Buffer.alloc(0),
                0,
                1
            );
            hdlcLayer.handleFrame(frame);

            await sendPromise;
        });

        it('should handle receive ready frames', () => {
            const frame = new HDLCFrame(
                2,
                FrameType.RR,
                testConfig.serverAddress,
                testConfig.clientAddress,
                Buffer.alloc(0),
                0,
                1
            );
            hdlcLayer.handleFrame(frame);
            // Should not throw
        });

        it('should handle receive not ready frames', () => {
            const frame = new HDLCFrame(
                2,
                FrameType.RNR,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
            // Should not throw
        });

        it('should handle reject frames', () => {
            const frame = new HDLCFrame(
                2,
                FrameType.REJ,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
            // Should not throw
        });
    });

    describe('disconnection', () => {
        beforeEach(async () => {
            // Connect before testing disconnection
            const connectPromise = hdlcLayer.connect();
            const frame = new HDLCFrame(
                3,
                FrameType.UA,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
            await connectPromise;
        });

        it('should handle normal disconnection', async () => {
            const disconnectPromise = hdlcLayer.disconnect();
            
            // Simulate UA response
            const frame = new HDLCFrame(
                3,
                FrameType.UA,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
            
            await disconnectPromise;
            expect(hdlcLayer.getState()).toBe(HDLCState.DISCONNECTED);
        });

        it('should handle disconnected mode frames', () => {
            const frame = new HDLCFrame(
                3,
                FrameType.DM,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
            expect(hdlcLayer.getState()).toBe(HDLCState.DISCONNECTED);
        });

        it('should handle frame reject frames', () => {
            const frame = new HDLCFrame(
                3,
                FrameType.FRMR,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
            // Should not throw
        });
    });

    describe('event handling', () => {
        it('should emit connected event', (done) => {
            hdlcLayer.on('connected', () => {
                expect(hdlcLayer.getState()).toBe(HDLCState.CONNECTED);
                done();
            });

            const connectPromise = hdlcLayer.connect();
            const frame = new HDLCFrame(
                3,
                FrameType.UA,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
        });

        it('should emit disconnected event', (done) => {
            hdlcLayer.on('disconnected', () => {
                expect(hdlcLayer.getState()).toBe(HDLCState.DISCONNECTED);
                done();
            });

            const frame = new HDLCFrame(
                3,
                FrameType.DM,
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
        });

        it('should emit error event', (done) => {
            hdlcLayer.on('error', (error) => {
                expect(error).toBeInstanceOf(Error);
                done();
            });

            // Simulate invalid frame handling
            const frame = new HDLCFrame(
                3,
                99 as FrameType, // Invalid frame type
                testConfig.serverAddress,
                testConfig.clientAddress
            );
            hdlcLayer.handleFrame(frame);
        });
    });
}); 