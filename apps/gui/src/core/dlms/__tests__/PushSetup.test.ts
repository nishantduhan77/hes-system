import { PushSetup } from '../cosem/PushSetup';
import { ObisCode } from '../ObisCode';
import { ServiceType, MessageType, PushObject, CommunicationWindow, PushDestination } from '../types/PushTypes';
import { createTestObisCode, createTestDate, datesAreEqual } from './test-utils';

describe('PushSetup', () => {
    let pushSetup: PushSetup;
    const testObisCode = createTestObisCode(0, 0, 25, 9, 0, 255);

    beforeEach(() => {
        pushSetup = new PushSetup(testObisCode);
    });

    describe('push objects', () => {
        const testPushObject: PushObject = {
            classId: 3,
            logicalName: [0, 0, 1, 0, 0, 255],
            attributeIndex: 2,
            dataIndex: 0
        };

        it('should add push object', () => {
            pushSetup.addPushObject(testPushObject);
            const objects = pushSetup.getPushObjects();
            expect(objects).toHaveLength(1);
            expect(objects[0]).toEqual(testPushObject);
        });

        it('should remove push object', () => {
            pushSetup.addPushObject(testPushObject);
            pushSetup.removePushObject(testPushObject.classId, testPushObject.logicalName);
            expect(pushSetup.getPushObjects()).toHaveLength(0);
        });

        it('should validate push object', () => {
            const invalidObject = {
                classId: -1,
                logicalName: [0],
                attributeIndex: 0
            };
            expect(() => pushSetup.addPushObject(invalidObject as PushObject)).toThrow();
        });
    });

    describe('destination configuration', () => {
        const testDestination: PushDestination = {
            transport: ServiceType.TCP,
            destination: 'localhost',
            message: MessageType.COSEM_APDU,
            port: 4059
        };

        it('should set destination', () => {
            pushSetup.setDestination(testDestination);
            expect(pushSetup.getDestination()).toEqual(testDestination);
        });

        it('should validate destination', () => {
            const invalidDestination = {
                transport: 99,
                destination: '',
                message: -1
            };
            expect(() => pushSetup.setDestination(invalidDestination as PushDestination)).toThrow();
        });

        it('should validate port number', () => {
            const invalidPort = { ...testDestination, port: 70000 };
            expect(() => pushSetup.setDestination(invalidPort)).toThrow();
        });
    });

    describe('communication windows', () => {
        const testWindow: CommunicationWindow = {
            startTime: createTestDate(2024, 0, 1, 9, 0),
            endTime: createTestDate(2024, 0, 1, 17, 0)
        };

        it('should add communication window', () => {
            pushSetup.addCommunicationWindow(testWindow);
            const windows = pushSetup.getCommunicationWindows();
            expect(windows).toHaveLength(1);
            expect(datesAreEqual(windows[0].startTime, testWindow.startTime)).toBe(true);
            expect(datesAreEqual(windows[0].endTime, testWindow.endTime)).toBe(true);
        });

        it('should remove communication window', () => {
            pushSetup.addCommunicationWindow(testWindow);
            pushSetup.removeCommunicationWindow(testWindow.startTime);
            expect(pushSetup.getCommunicationWindows()).toHaveLength(0);
        });

        it('should validate window times', () => {
            const invalidWindow = {
                startTime: createTestDate(2024, 0, 1, 17, 0),
                endTime: createTestDate(2024, 0, 1, 9, 0)
            };
            expect(() => pushSetup.addCommunicationWindow(invalidWindow)).toThrow();
        });
    });

    describe('retry configuration', () => {
        it('should set randomisation start interval', () => {
            pushSetup.setRandomisationStartInterval(30);
            expect(pushSetup.getRandomisationStartInterval()).toBe(30);
        });

        it('should validate randomisation start interval', () => {
            expect(() => pushSetup.setRandomisationStartInterval(-1)).toThrow();
        });

        it('should set number of retries', () => {
            pushSetup.setNumberOfRetries(5);
            expect(pushSetup.getNumberOfRetries()).toBe(5);
        });

        it('should validate number of retries', () => {
            expect(() => pushSetup.setNumberOfRetries(256)).toThrow();
        });

        it('should set repetition delay', () => {
            pushSetup.setRepetitionDelay(120);
            expect(pushSetup.getRepetitionDelay()).toBe(120);
        });

        it('should validate repetition delay', () => {
            expect(() => pushSetup.setRepetitionDelay(-1)).toThrow();
        });
    });

    describe('push operation', () => {
        const testWindow: CommunicationWindow = {
            startTime: new Date(Date.now() - 3600000), // 1 hour ago
            endTime: new Date(Date.now() + 3600000) // 1 hour from now
        };

        beforeEach(() => {
            pushSetup.addCommunicationWindow(testWindow);
        });

        it('should execute push within communication window', async () => {
            await expect(pushSetup.push()).resolves.not.toThrow();
        });

        it('should fail push outside communication window', async () => {
            pushSetup.removeCommunicationWindow(testWindow.startTime);
            const futureWindow: CommunicationWindow = {
                startTime: new Date(Date.now() + 3600000),
                endTime: new Date(Date.now() + 7200000)
            };
            pushSetup.addCommunicationWindow(futureWindow);
            await expect(pushSetup.push()).rejects.toThrow();
        });

        it('should retry on failure', async () => {
            pushSetup.setNumberOfRetries(2);
            pushSetup.setRepetitionDelay(1); // 1 second delay for faster test
            await expect(pushSetup.push()).resolves.not.toThrow();
        });
    });

    describe('attribute access', () => {
        it('should get logical name', () => {
            const logicalName = pushSetup.getLogicalName();
            expect(logicalName).toBeInstanceOf(ObisCode);
            expect(logicalName.toString()).toBe(testObisCode.toString());
        });

        it('should not allow modifying logical name', () => {
            const newObisCode = new ObisCode(0, 0, 0, 0, 0, 0);
            expect(() => {
                // @ts-ignore - Testing protected method
                pushSetup.handleSet(1, newObisCode);
            }).toThrow();
        });

        it('should handle invalid attribute access', () => {
            expect(() => {
                // @ts-ignore - Testing protected method
                pushSetup.handleGet(99);
            }).toThrow();
            expect(() => {
                // @ts-ignore - Testing protected method
                pushSetup.handleSet(99, null);
            }).toThrow();
        });
    });
}); 