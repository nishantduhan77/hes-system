"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosemInterfaceClass = void 0;
const DataType_1 = require("./types/DataType");
/**
 * Base class for all COSEM interface classes
 */
class CosemInterfaceClass {
    constructor(classId, logicalName) {
        this.classId = classId;
        this.logicalName = logicalName;
        this.attributes = new Map();
        this.methods = new Map();
        // Register logical name attribute (mandatory for all classes)
        this.registerAttribute(1, 'logical_name', DataType_1.DataType.OCTET_STRING, false);
    }
    /**
     * Get class ID
     */
    getClassId() {
        return this.classId;
    }
    /**
     * Get logical name
     */
    getLogicalName() {
        return this.logicalName;
    }
    /**
     * Register attribute
     */
    registerAttribute(id, name, type, writable) {
        this.attributes.set(id, { id, name, type, writable });
    }
    /**
     * Register method
     */
    registerMethod(id, name) {
        this.methods.set(id, { id, name });
    }
    /**
     * Get attribute
     */
    getAttribute(id) {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Invalid attribute id ${id}`);
        }
        return this.handleGet(id);
    }
    /**
     * Set attribute
     */
    setAttribute(id, value) {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Invalid attribute id ${id}`);
        }
        if (!attribute.writable) {
            throw new Error(`Attribute ${id} is read-only`);
        }
        this.handleSet(id, value);
    }
    /**
     * Invoke method
     */
    invoke(id, params) {
        const method = this.methods.get(id);
        if (!method) {
            throw new Error(`Invalid method id ${id}`);
        }
        return this.handleAction(id, params);
    }
    /**
     * Get attribute definition
     */
    getAttributeDefinition(id) {
        return this.attributes.get(id);
    }
    /**
     * Get method definition
     */
    getMethodDefinition(id) {
        return this.methods.get(id);
    }
    /**
     * Get all attribute definitions
     */
    getAttributeDefinitions() {
        return Array.from(this.attributes.values());
    }
    /**
     * Get all method definitions
     */
    getMethodDefinitions() {
        return Array.from(this.methods.values());
    }
    /**
     * Handle action request
     * Can be overridden by derived classes
     */
    handleAction(methodId, params) {
        throw new Error('Method not implemented');
    }
}
exports.CosemInterfaceClass = CosemInterfaceClass;
