"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSetup = void 0;
const CosemInterfaceClass_1 = require("../CosemInterfaceClass");
const DataType_1 = require("../types/DataType");
const PushTypes_1 = require("../types/PushTypes");
/**
 * Push Setup Class (IC: 40)
 * This class is used for configuring and managing push operations
 */
class PushSetup extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, destination = {
        transport: PushTypes_1.ServiceType.TCP,
        destination: 'localhost',
        message: PushTypes_1.MessageType.COSEM_APDU
    }) {
        super(40, logicalName);
        this.pushObjectList = [];
        this.sendDestinationAndMethod = destination;
        this.communicationWindow = [];
        this.randomisationStartInterval = 0;
        this.numberOfRetries = 3;
        this.repetitionDelay = 60;
        // Register class attributes
        this.registerAttribute(1, 'logical_name', DataType_1.DataType.OCTET_STRING, false);
        this.registerAttribute(2, 'push_object_list', DataType_1.DataType.ARRAY, true);
        this.registerAttribute(3, 'send_destination_and_method', DataType_1.DataType.STRUCT, true);
        this.registerAttribute(4, 'communication_window', DataType_1.DataType.ARRAY, true);
        this.registerAttribute(5, 'randomisation_start_interval', DataType_1.DataType.UINT16, true);
        this.registerAttribute(6, 'number_of_retries', DataType_1.DataType.UINT8, true);
        this.registerAttribute(7, 'repetition_delay', DataType_1.DataType.UINT16, true);
        // Register class methods
        this.registerMethod(1, 'push');
    }
    /**
     * Add push object
     */
    addPushObject(object) {
        this.validatePushObject(object);
        this.pushObjectList.push({ ...object });
    }
    /**
     * Remove push object
     */
    removePushObject(classId, logicalName) {
        this.pushObjectList = this.pushObjectList.filter(obj => obj.classId !== classId ||
            !this.compareLogicalName(obj.logicalName, logicalName));
    }
    /**
     * Get push objects
     */
    getPushObjects() {
        return [...this.pushObjectList];
    }
    /**
     * Set destination
     */
    setDestination(destination) {
        this.validatePushDestination(destination);
        this.sendDestinationAndMethod = { ...destination };
    }
    /**
     * Get destination
     */
    getDestination() {
        return { ...this.sendDestinationAndMethod };
    }
    /**
     * Add communication window
     */
    addCommunicationWindow(window) {
        this.validateCommunicationWindow(window);
        this.communicationWindow.push({
            startTime: new Date(window.startTime),
            endTime: new Date(window.endTime)
        });
    }
    /**
     * Remove communication window
     */
    removeCommunicationWindow(startTime) {
        this.communicationWindow = this.communicationWindow.filter(w => w.startTime.getTime() !== startTime.getTime());
    }
    /**
     * Get communication windows
     */
    getCommunicationWindows() {
        return this.communicationWindow.map(w => ({
            startTime: new Date(w.startTime),
            endTime: new Date(w.endTime)
        }));
    }
    /**
     * Set randomisation start interval
     */
    setRandomisationStartInterval(interval) {
        if (interval < 0) {
            throw new Error('Randomisation start interval must be non-negative');
        }
        this.randomisationStartInterval = interval;
    }
    /**
     * Get randomisation start interval
     */
    getRandomisationStartInterval() {
        return this.randomisationStartInterval;
    }
    /**
     * Set number of retries
     */
    setNumberOfRetries(retries) {
        if (retries < 0 || retries > 255) {
            throw new Error('Number of retries must be between 0 and 255');
        }
        this.numberOfRetries = retries;
    }
    /**
     * Get number of retries
     */
    getNumberOfRetries() {
        return this.numberOfRetries;
    }
    /**
     * Set repetition delay
     */
    setRepetitionDelay(delay) {
        if (delay < 0) {
            throw new Error('Repetition delay must be non-negative');
        }
        this.repetitionDelay = delay;
    }
    /**
     * Get repetition delay
     */
    getRepetitionDelay() {
        return this.repetitionDelay;
    }
    /**
     * Push data
     */
    async push() {
        const now = new Date();
        // Check if within communication window
        if (this.communicationWindow.length > 0) {
            const inWindow = this.communicationWindow.some(window => window.startTime <= now && window.endTime >= now);
            if (!inWindow) {
                throw new Error('Current time is outside communication window');
            }
        }
        // Apply randomisation if configured
        if (this.randomisationStartInterval > 0) {
            const delay = Math.floor(Math.random() * this.randomisationStartInterval);
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
        // Attempt push with retries
        let attempt = 0;
        while (attempt <= this.numberOfRetries) {
            try {
                await this.executePush();
                break;
            }
            catch (error) {
                if (attempt === this.numberOfRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, this.repetitionDelay * 1000));
                attempt++;
            }
        }
    }
    /**
     * Execute push operation
     */
    async executePush() {
        // TODO: Implement actual push operation
        // This would involve:
        // 1. Collecting data from push objects
        // 2. Formatting data according to message type
        // 3. Sending data using configured transport
        // 4. Handling transport-specific requirements
        console.log('Executing push operation:', {
            destination: this.sendDestinationAndMethod,
            objects: this.pushObjectList
        });
    }
    /**
     * Validate push object
     */
    validatePushObject(object) {
        if (!object.classId || object.classId < 0) {
            throw new Error('Invalid class ID');
        }
        if (!Array.isArray(object.logicalName) || object.logicalName.length !== 6) {
            throw new Error('Invalid logical name');
        }
        if (!object.attributeIndex || object.attributeIndex < 0) {
            throw new Error('Invalid attribute index');
        }
    }
    /**
     * Validate push destination
     */
    validatePushDestination(destination) {
        if (!Object.values(PushTypes_1.ServiceType).includes(destination.transport)) {
            throw new Error('Invalid transport type');
        }
        if (!destination.destination) {
            throw new Error('Destination is required');
        }
        if (!Object.values(PushTypes_1.MessageType).includes(destination.message)) {
            throw new Error('Invalid message type');
        }
        if (destination.port !== undefined && (destination.port < 0 || destination.port > 65535)) {
            throw new Error('Invalid port number');
        }
    }
    /**
     * Validate communication window
     */
    validateCommunicationWindow(window) {
        if (!(window.startTime instanceof Date) || !(window.endTime instanceof Date)) {
            throw new Error('Invalid window times');
        }
        if (window.startTime >= window.endTime) {
            throw new Error('Start time must be before end time');
        }
    }
    /**
     * Compare logical names
     */
    compareLogicalName(a, b) {
        if (a.length !== b.length)
            return false;
        return a.every((value, index) => value === b[index]);
    }
    /**
     * Handle get request
     */
    handleGet(attributeId) {
        switch (attributeId) {
            case 1:
                return this.getLogicalName().toBuffer();
            case 2:
                return this.getPushObjects();
            case 3:
                return this.getDestination();
            case 4:
                return this.getCommunicationWindows();
            case 5:
                return this.getRandomisationStartInterval();
            case 6:
                return this.getNumberOfRetries();
            case 7:
                return this.getRepetitionDelay();
            default:
                throw new Error(`Invalid attribute id ${attributeId} for PushSetup class`);
        }
    }
    /**
     * Handle set request
     */
    handleSet(attributeId, value) {
        switch (attributeId) {
            case 1:
                throw new Error('Logical name is read-only');
            case 2:
                if (!Array.isArray(value)) {
                    throw new Error('Push object list must be an array');
                }
                this.pushObjectList = value.map(obj => {
                    this.validatePushObject(obj);
                    return { ...obj };
                });
                break;
            case 3:
                this.validatePushDestination(value);
                this.sendDestinationAndMethod = { ...value };
                break;
            case 4:
                if (!Array.isArray(value)) {
                    throw new Error('Communication window must be an array');
                }
                this.communicationWindow = value.map(window => {
                    this.validateCommunicationWindow(window);
                    return {
                        startTime: new Date(window.startTime),
                        endTime: new Date(window.endTime)
                    };
                });
                break;
            case 5:
                this.setRandomisationStartInterval(value);
                break;
            case 6:
                this.setNumberOfRetries(value);
                break;
            case 7:
                this.setRepetitionDelay(value);
                break;
            default:
                throw new Error(`Invalid attribute id ${attributeId} for PushSetup class`);
        }
    }
    /**
     * Handle action request
     */
    handleAction(methodId) {
        switch (methodId) {
            case 1: // push
                return this.push();
            default:
                throw new Error(`Invalid method id ${methodId} for PushSetup class`);
        }
    }
}
exports.PushSetup = PushSetup;
