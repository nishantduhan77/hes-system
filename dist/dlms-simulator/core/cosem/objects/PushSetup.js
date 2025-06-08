"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSetup = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const ObisCode_1 = require("../obis/ObisCode");
const Types_1 = require("../data/Types");
/**
 * Push Setup Class (class_id = 40)
 * Implements push data functionality for periodic data transmission
 * OBIS Code: 0.4.25.9.0.255
 */
class PushSetup extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor() {
        super(ObisCode_1.ObisCode.fromString('0.4.25.9.0.255'), 40); // class_id = 40
        // Push object list containing all objects to be pushed
        this.pushObjectList = [
            // Device ID (1/2)
            {
                classId: 1,
                logicalName: '0.0.96.1.2.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Push Setup ID (40/1)
            {
                classId: 40,
                logicalName: '0.0.25.9.0.255',
                attributeIndex: 1,
                dataIndex: 0
            },
            // Real time clock (8/2)
            {
                classId: 8,
                logicalName: '0.0.1.0.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Current Ir (3/2)
            {
                classId: 3,
                logicalName: '1.0.31.7.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Current Iy (3/2)
            {
                classId: 3,
                logicalName: '1.0.51.7.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Current Ib (3/2)
            {
                classId: 3,
                logicalName: '1.0.71.7.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Voltage VRN (3/2)
            {
                classId: 3,
                logicalName: '1.0.32.7.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Voltage VYN (3/2)
            {
                classId: 3,
                logicalName: '1.0.52.7.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Voltage VBN (3/2)
            {
                classId: 3,
                logicalName: '1.0.72.7.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Cumulative energy kWh Import (3/2)
            {
                classId: 3,
                logicalName: '1.0.1.8.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Cumulative energy kvah Import (3/2)
            {
                classId: 3,
                logicalName: '1.0.9.8.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Cumulative energy kWh Export (3/2)
            {
                classId: 3,
                logicalName: '1.0.2.8.0.255',
                attributeIndex: 2,
                dataIndex: 0
            },
            // Cumulative energy kvah Export (3/2)
            {
                classId: 3,
                logicalName: '1.0.10.8.0.255',
                attributeIndex: 2,
                dataIndex: 0
            }
        ];
        // Push configuration parameters
        this.sendDestinationAndMethod = '';
        this.communicationWindow = [];
        this.randomisationStartInterval = 0;
        this.numberOfRetries = 3;
        this.repetitionDelay = 60; // Default 60 seconds
        this.initializeAttributes();
    }
    initializeAttributes() {
        // Attribute 1: Logical Name (inherited)
        // Attribute 2: Push Object List
        this.addAttribute(2, {
            name: 'push_object_list',
            type: 'array',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.getPushObjectList(),
            setValue: (value) => { this.setPushObjectList(value); }
        });
        // Attribute 3: Send Destination And Method
        // RW access, Read only in PUSH association and RW in US association
        this.addAttribute(3, {
            name: 'send_destination_and_method',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.sendDestinationAndMethod,
            setValue: (value) => { this.sendDestinationAndMethod = value; }
        });
        // Attribute 4: Communication Window
        this.addAttribute(4, {
            name: 'communication_window',
            type: 'array',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.communicationWindow,
            setValue: (value) => { this.communicationWindow = value; }
        });
        // Attribute 5: Randomisation Start Interval
        this.addAttribute(5, {
            name: 'randomisation_start_interval',
            type: 'long-unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.randomisationStartInterval,
            setValue: (value) => { this.randomisationStartInterval = value; }
        });
        // Attribute 6: Number of Retries
        this.addAttribute(6, {
            name: 'number_of_retries',
            type: 'unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.numberOfRetries,
            setValue: (value) => { this.numberOfRetries = value; }
        });
        // Attribute 7: Repetition Delay
        this.addAttribute(7, {
            name: 'repetition_delay',
            type: 'long-unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.repetitionDelay,
            setValue: (value) => { this.repetitionDelay = value; }
        });
    }
    /**
     * Get push object list in DLMS format
     */
    getPushObjectList() {
        return this.pushObjectList.map(obj => ({
            classId: obj.classId,
            logicalName: obj.logicalName,
            attributeIndex: obj.attributeIndex,
            dataIndex: obj.dataIndex
        }));
    }
    /**
     * Set push object list from DLMS format
     */
    setPushObjectList(value) {
        this.pushObjectList = value.map(obj => ({
            classId: obj.classId,
            logicalName: obj.logicalName,
            attributeIndex: obj.attributeIndex,
            dataIndex: obj.dataIndex
        }));
    }
    /**
     * Push data to destination
     * Implements the push operation with encryption and authentication
     */
    async pushData() {
        try {
            // 1. Collect data from all objects in push_object_list
            const data = await this.collectPushData();
            // 2. Encrypt and authenticate data
            const secureData = await this.encryptAndAuthenticate(data);
            // 3. Send to destination with retry mechanism
            return await this.sendWithRetry(secureData);
        }
        catch (error) {
            console.error('Push data failed:', error);
            return false;
        }
    }
    /**
     * Collect data from all objects in push list
     */
    async collectPushData() {
        const data = new Map();
        for (const obj of this.pushObjectList) {
            try {
                // Here you would implement the actual data collection
                // from each object using the COSEM interface
                const value = await this.readObjectValue(obj);
                data.set(obj.logicalName, value);
            }
            catch (error) {
                console.error(`Failed to collect data for ${obj.logicalName}:`, error);
            }
        }
        return data;
    }
    /**
     * Read value from a COSEM object
     */
    async readObjectValue(obj) {
        // This is a placeholder - implement actual COSEM object reading
        // based on your DLMS/COSEM implementation
        return null;
    }
    /**
     * Encrypt and authenticate push data
     */
    async encryptAndAuthenticate(data) {
        // Implement encryption and authentication according to your security requirements
        // This is a placeholder for the actual implementation
        return Buffer.from('');
    }
    /**
     * Send data to destination with retry mechanism
     */
    async sendWithRetry(data) {
        let retries = 0;
        while (retries <= this.numberOfRetries) {
            try {
                // Implement actual sending mechanism
                // await this.send(data);
                return true;
            }
            catch (error) {
                retries++;
                if (retries <= this.numberOfRetries) {
                    // Wait for repetition delay before retrying
                    await new Promise(resolve => setTimeout(resolve, this.repetitionDelay * 1000));
                }
            }
        }
        return false;
    }
    toString() {
        return `PushSetup [Objects: ${this.pushObjectList.length}, Destination: ${this.sendDestinationAndMethod}]`;
    }
}
exports.PushSetup = PushSetup;
