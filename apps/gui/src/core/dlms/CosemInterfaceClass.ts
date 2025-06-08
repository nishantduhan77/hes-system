import { ObisCode } from './ObisCode';
import { DataType } from './types/DataType';

/**
 * COSEM Attribute Definition
 */
interface AttributeDefinition {
    id: number;
    name: string;
    type: DataType;
    writable: boolean;
}

/**
 * COSEM Method Definition
 */
interface MethodDefinition {
    id: number;
    name: string;
}

/**
 * Base class for all COSEM interface classes
 */
export abstract class CosemInterfaceClass {
    private classId: number;
    private logicalName: ObisCode;
    private attributes: Map<number, AttributeDefinition>;
    private methods: Map<number, MethodDefinition>;

    constructor(classId: number, logicalName: ObisCode) {
        this.classId = classId;
        this.logicalName = logicalName;
        this.attributes = new Map();
        this.methods = new Map();

        // Register logical name attribute (mandatory for all classes)
        this.registerAttribute(1, 'logical_name', DataType.OCTET_STRING, false);
    }

    /**
     * Get class ID
     */
    public getClassId(): number {
        return this.classId;
    }

    /**
     * Get logical name
     */
    public getLogicalName(): ObisCode {
        return this.logicalName;
    }

    /**
     * Register attribute
     */
    protected registerAttribute(id: number, name: string, type: DataType, writable: boolean): void {
        this.attributes.set(id, { id, name, type, writable });
    }

    /**
     * Register method
     */
    protected registerMethod(id: number, name: string): void {
        this.methods.set(id, { id, name });
    }

    /**
     * Get attribute
     */
    public getAttribute(id: number): any {
        const attribute = this.attributes.get(id);
        if (!attribute) {
            throw new Error(`Invalid attribute id ${id}`);
        }
        return this.handleGet(id);
    }

    /**
     * Set attribute
     */
    public setAttribute(id: number, value: any): void {
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
    public invoke(id: number, params?: any): any {
        const method = this.methods.get(id);
        if (!method) {
            throw new Error(`Invalid method id ${id}`);
        }
        return this.handleAction(id, params);
    }

    /**
     * Get attribute definition
     */
    public getAttributeDefinition(id: number): AttributeDefinition | undefined {
        return this.attributes.get(id);
    }

    /**
     * Get method definition
     */
    public getMethodDefinition(id: number): MethodDefinition | undefined {
        return this.methods.get(id);
    }

    /**
     * Get all attribute definitions
     */
    public getAttributeDefinitions(): AttributeDefinition[] {
        return Array.from(this.attributes.values());
    }

    /**
     * Get all method definitions
     */
    public getMethodDefinitions(): MethodDefinition[] {
        return Array.from(this.methods.values());
    }

    /**
     * Handle get request
     * Must be implemented by derived classes
     */
    protected abstract handleGet(attributeId: number): any;

    /**
     * Handle set request
     * Must be implemented by derived classes
     */
    protected abstract handleSet(attributeId: number, value: any): void;

    /**
     * Handle action request
     * Can be overridden by derived classes
     */
    protected handleAction(methodId: number, params?: any): any {
        throw new Error('Method not implemented');
    }
} 