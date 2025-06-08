"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosemInterfaceClass = void 0;
const Types_1 = require("../data/Types");
/**
 * Base class for all COSEM interface classes
 * Implements core functionality as defined in DLMS Green Book
 */
class CosemInterfaceClass {
    constructor(logicalName, classId, version = 0) {
        this.logicalName = logicalName;
        this.classId = classId;
        this.version = version;
        this.attributes = new Map();
        this.methods = new Map();
        // Logical name is always attribute 1
        this.addAttribute(1, {
            name: 'logical_name',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.logicalName.toString()
        });
    }
    /**
     * Get the logical name
     */
    getLogicalName() {
        return this.logicalName;
    }
    /**
     * Get the class ID
     */
    getClassId() {
        return this.classId;
    }
    /**
     * Add an attribute to the interface class
     */
    addAttribute(id, attribute) {
        this.attributes.set(id, attribute);
    }
    /**
     * Add a method to the interface class
     */
    addMethod(id, method) {
        this.methods.set(id, method);
    }
    /**
     * Get attribute value by ID
     */
    getAttribute(id) {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Attribute ${id} not found`);
        }
        return attribute.getValue();
    }
    /**
     * Set attribute value by ID
     */
    setAttribute(id, value) {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Attribute ${id} not found`);
        }
        if (!attribute.setValue) {
            throw new Error(`Attribute ${id} is read-only`);
        }
        attribute.setValue(value);
    }
    /**
     * Execute method by ID
     */
    executeMethod(id, ...args) {
        const method = this.methods.get(id);
        if (!method) {
            throw new Error(`Method ${id} not found`);
        }
        return method.execute(...args);
    }
    /**
     * Get class metadata
     */
    getClassInfo() {
        return {
            classId: this.classId,
            version: this.version,
            logicalName: this.logicalName.toString()
        };
    }
    /**
     * Get all attribute IDs
     */
    getAttributeIds() {
        return Array.from(this.attributes.keys());
    }
    /**
     * Get all method IDs
     */
    getMethodIds() {
        return Array.from(this.methods.keys());
    }
    /**
     * Get attribute access level
     */
    getAttributeAccess(id) {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Attribute ${id} not found`);
        }
        return attribute.access;
    }
    /**
     * Get attribute type
     */
    getAttributeType(id) {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Attribute ${id} not found`);
        }
        return attribute.type;
    }
}
exports.CosemInterfaceClass = CosemInterfaceClass;
