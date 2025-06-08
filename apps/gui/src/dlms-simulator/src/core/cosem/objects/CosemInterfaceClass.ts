import { ObisCode } from '../obis/ObisCode';
import { AccessLevel, DlmsDataType } from '../data/Types';

interface Attribute {
    name: string;
    type: DlmsDataType;
    access: AccessLevel;
    getValue: () => any;
    setValue?: (value: any) => void;
}

interface Method {
    name: string;
    execute: (...args: any[]) => any;
}

/**
 * Base class for all COSEM interface classes
 */
export abstract class CosemInterfaceClass {
    protected logicalName: ObisCode;
    protected classId: number;
    protected attributes: Map<number, Attribute>;
    protected methods: Map<number, Method>;

    constructor(logicalName: ObisCode, classId: number) {
        this.logicalName = logicalName;
        this.classId = classId;
        this.attributes = new Map();
        this.methods = new Map();

        // Add logical name as attribute 1 (present in all interface classes)
        this.addAttribute(1, {
            name: 'logical_name',
            type: 'octet-string',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.logicalName.toString()
        });
    }

    /**
     * Get the logical name
     */
    public getLogicalName(): ObisCode {
        return this.logicalName;
    }

    /**
     * Get the class ID
     */
    public getClassId(): number {
        return this.classId;
    }

    /**
     * Add an attribute to the interface class
     */
    protected addAttribute(id: number, attribute: Attribute): void {
        this.attributes.set(id, attribute);
    }

    /**
     * Add a method to the interface class
     */
    protected addMethod(id: number, method: Method): void {
        this.methods.set(id, method);
    }

    /**
     * Get an attribute value by ID
     */
    public getAttribute(id: number): any {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Attribute ${id} not found`);
        }
        return attribute.getValue();
    }

    /**
     * Set an attribute value by ID
     */
    public setAttribute(id: number, value: any): void {
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
     * Execute a method by ID
     */
    public executeMethod(id: number, ...args: any[]): any {
        const method = this.methods.get(id);
        if (!method) {
            throw new Error(`Method ${id} not found`);
        }
        return method.execute(...args);
    }

    /**
     * Get all attribute IDs
     */
    public getAttributeIds(): number[] {
        return Array.from(this.attributes.keys());
    }

    /**
     * Get all method IDs
     */
    public getMethodIds(): number[] {
        return Array.from(this.methods.keys());
    }

    /**
     * Get attribute access level
     */
    public getAttributeAccess(id: number): AccessLevel {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Attribute ${id} not found`);
        }
        return attribute.access;
    }

    /**
     * Get attribute type
     */
    public getAttributeType(id: number): DlmsDataType {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Attribute ${id} not found`);
        }
        return attribute.type;
    }

    /**
     * Convert to string representation
     */
    public abstract toString(): string;
} 