"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileGeneric = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const Types_1 = require("../data/Types");
/**
 * Profile Generic Class (IC: 7)
 * Used for capturing and storing periodic meter readings
 */
class ProfileGeneric extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, maxEntries = 1000, capturePeriod = 900 // 15 minutes default
    ) {
        super(logicalName, 7);
        this.buffer = [];
        this.captureObjects = [];
        this.capturePeriod = capturePeriod;
        this.sortMethod = 1; // Sort by time ascending
        this.profileEntries = maxEntries;
        this.entriesInUse = 0;
        this.initializeAttributes();
    }
    initializeAttributes() {
        // Attribute 2: buffer
        this.addAttribute(2, {
            name: 'buffer',
            type: 'array',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.buffer
        });
        // Attribute 3: capture_objects
        this.addAttribute(3, {
            name: 'capture_objects',
            type: 'array',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.captureObjects,
            setValue: (objects) => {
                this.captureObjects = objects;
            }
        });
        // Attribute 4: capture_period
        this.addAttribute(4, {
            name: 'capture_period',
            type: 'double-long-unsigned',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.capturePeriod,
            setValue: (period) => {
                this.capturePeriod = period;
            }
        });
        // Attribute 5: sort_method
        this.addAttribute(5, {
            name: 'sort_method',
            type: 'enum',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => this.sortMethod,
            setValue: (method) => {
                this.sortMethod = method;
            }
        });
        // Attribute 6: entries_in_use
        this.addAttribute(6, {
            name: 'entries_in_use',
            type: 'double-long-unsigned',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.entriesInUse
        });
        // Attribute 7: profile_entries
        this.addAttribute(7, {
            name: 'profile_entries',
            type: 'double-long-unsigned',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.profileEntries
        });
        // Add capture method
        this.addMethod(1, {
            name: 'capture',
            execute: () => this.capture()
        });
        // Add reset method
        this.addMethod(2, {
            name: 'reset',
            execute: () => this.reset()
        });
    }
    /**
     * Add a capture object
     */
    addCaptureObject(object) {
        this.captureObjects.push(object);
    }
    /**
     * Remove a capture object
     */
    removeCaptureObject(index) {
        this.captureObjects.splice(index, 1);
    }
    /**
     * Capture current values
     */
    capture() {
        const entry = {
            timestamp: new Date(),
            values: this.captureObjects.map(obj => {
                // In real implementation, this would get the actual value
                // from the referenced object
                return null;
            })
        };
        this.buffer.push(entry);
        if (this.buffer.length > this.profileEntries) {
            this.buffer.shift(); // Remove oldest entry
        }
        this.entriesInUse = this.buffer.length;
    }
    /**
     * Reset the profile
     */
    reset() {
        this.buffer = [];
        this.entriesInUse = 0;
    }
    /**
     * Get entries between start and end time
     */
    getEntries(startTime, endTime) {
        return this.buffer.filter(entry => entry.timestamp >= startTime && entry.timestamp <= endTime);
    }
    /**
     * Get the latest entry
     */
    getLatestEntry() {
        return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `Profile Generic (${this.entriesInUse}/${this.profileEntries} entries)`;
    }
}
exports.ProfileGeneric = ProfileGeneric;
