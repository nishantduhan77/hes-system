import { HDLCFrame, FrameFormat, FrameType, HDLCAddress, FLAG, ESCAPE } from '../transport/HDLCFrame';
import { createTestBuffer } from './test-utils';

describe('HDLCFrame', () => {
    const testAddress: HDLCAddress = { upper: 1, lower: 1 };
    const testData = createTestBuffer(10, 0xFF);

    describe('constructor', () => {
        it('should create frame with minimal parameters', () => {
            const frame = new HDLCFrame(
                FrameFormat.TYPE_1,
                FrameType.I_FRAME,
                testAddress,
                testAddress
            );
            expect(frame.getFormat()).toBe(FrameFormat.TYPE_1);
            expect(frame.getType()).toBe(FrameType.I_FRAME);
            expect(frame.getData().length).toBe(0);
        });

        it('should create frame with all parameters', () => {
            const frame = new HDLCFrame(
                FrameFormat.TYPE_1,
                FrameType.I_FRAME,
                testAddress,
                testAddress,
                testData,
                1,
                2,
                true,
                false
            );
            expect(frame.getSendSequence()).toBe(1);
            expect(frame.getReceiveSequence()).toBe(2);
            expect(frame.isPoll()).toBe(true);
            expect(frame.isFinal()).toBe(false);
        });
    });

    describe('encode/decode', () => {
        it('should correctly encode and decode frame', () => {
            const frameFormat = FrameFormat.TYPE_1;
            const destAddr = 0x01;
            const srcAddr = 0x02;
            const control = 0x10;
            const data = Buffer.from([0x01, 0x02, 0x03, 0x04]);

            const frame = new HDLCFrame(frameFormat, destAddr, srcAddr, control, data);
            const encoded = frame.encode();
            const decoded = HDLCFrame.decode(encoded);

            expect(decoded.getFrameFormat()).toBe(frameFormat);
            expect(decoded.getDestinationAddress()).toBe(destAddr);
            expect(decoded.getSourceAddress()).toBe(srcAddr);
            expect(decoded.getControl()).toBe(control);
            expect(decoded.getData()).toEqual(data);
        });

        it('should handle empty data frame', () => {
            const frameFormat = FrameFormat.TYPE_1;
            const destAddr = 0x01;
            const srcAddr = 0x02;
            const control = 0x10;

            const frame = new HDLCFrame(frameFormat, destAddr, srcAddr, control);
            const encoded = frame.encode();
            const decoded = HDLCFrame.decode(encoded);

            expect(decoded.getFrameFormat()).toBe(frameFormat);
            expect(decoded.getDestinationAddress()).toBe(destAddr);
            expect(decoded.getSourceAddress()).toBe(srcAddr);
            expect(decoded.getControl()).toBe(control);
            expect(decoded.getData().length).toBe(0);
        });

        it('should handle frame escape sequences', () => {
            const frameFormat = FrameFormat.TYPE_1;
            const destAddr = 0x01;
            const srcAddr = 0x02;
            const control = 0x10;
            const data = Buffer.from([FLAG, ESCAPE, 0x03, 0x04]);

            const frame = new HDLCFrame(frameFormat, destAddr, srcAddr, control, data);
            const encoded = frame.encode();
            const decoded = HDLCFrame.decode(encoded);

            expect(decoded.getData()).toEqual(data);
        });

        it('should throw error for invalid frame', () => {
            const invalidFrame = Buffer.from([0x01, 0x02, 0x03]); // No flags
            expect(() => HDLCFrame.decode(invalidFrame)).toThrow('Invalid frame: missing flags');
        });

        it('should throw error for incomplete escape sequence', () => {
            const frameFormat = FrameFormat.TYPE_1;
            const destAddr = 0x01;
            const srcAddr = 0x02;
            const control = 0x10;
            const frame = new HDLCFrame(frameFormat, destAddr, srcAddr, control);
            const encoded = frame.encode();
            
            // Corrupt the frame by adding an escape character at the end
            const corrupted = Buffer.concat([encoded, Buffer.from([ESCAPE])]);
            
            expect(() => HDLCFrame.decode(corrupted)).toThrow('Invalid frame: incomplete escape sequence');
        });

        it('should throw error for frame that is too short', () => {
            const shortFrame = Buffer.from([FLAG, 0x01, 0x02, FLAG]); // Too short
            expect(() => HDLCFrame.decode(shortFrame)).toThrow('Invalid frame: too short');
        });
    });

    describe('frame types', () => {
        it('should handle Type 1 (Information) frames', () => {
            const frame = new HDLCFrame(
                FrameFormat.TYPE_1,
                FrameType.I_FRAME,
                testAddress,
                testAddress,
                testData
            );
            expect(frame.getFormat()).toBe(FrameFormat.TYPE_1);
        });

        it('should handle Type 2 (Supervisory) frames', () => {
            const frame = new HDLCFrame(
                FrameFormat.TYPE_2,
                FrameType.RR,
                testAddress,
                testAddress
            );
            expect(frame.getFormat()).toBe(FrameFormat.TYPE_2);
        });

        it('should handle Type 3 (Unnumbered) frames', () => {
            const frame = new HDLCFrame(
                FrameFormat.TYPE_3,
                FrameType.SNRM,
                testAddress,
                testAddress
            );
            expect(frame.getFormat()).toBe(FrameFormat.TYPE_3);
        });
    });

    describe('sequence numbers', () => {
        it('should handle send sequence numbers', () => {
            const frame = new HDLCFrame(
                FrameFormat.TYPE_1,
                FrameType.I_FRAME,
                testAddress,
                testAddress,
                testData,
                5
            );
            expect(frame.getSendSequence()).toBe(5);
        });

        it('should handle receive sequence numbers', () => {
            const frame = new HDLCFrame(
                FrameFormat.TYPE_1,
                FrameType.I_FRAME,
                testAddress,
                testAddress,
                testData,
                0,
                3
            );
            expect(frame.getReceiveSequence()).toBe(3);
        });
    });

    describe('addressing', () => {
        it('should handle source addressing', () => {
            const sourceAddr: HDLCAddress = { upper: 2, lower: 3 };
            const frame = new HDLCFrame(
                FrameFormat.TYPE_1,
                FrameType.I_FRAME,
                sourceAddr,
                testAddress
            );
            expect(frame.getSourceAddress()).toEqual(sourceAddr);
        });

        it('should handle destination addressing', () => {
            const destAddr: HDLCAddress = { upper: 4, lower: 5 };
            const frame = new HDLCFrame(
                FrameFormat.TYPE_1,
                FrameType.I_FRAME,
                testAddress,
                destAddr
            );
            expect(frame.getDestinationAddress()).toEqual(destAddr);
        });
    });
}); 