import { CosemInterfaceClass } from '../CosemInterfaceClass';
import { ObisCode } from '../ObisCode';
import { DataType } from '../types/DataType';
import { Script, ScriptAction, ScriptActionType } from '../types/ScriptTypes';

/**
 * Script Table Class (IC: 9)
 * This class is used for storing and executing scripts
 */
export class ScriptTable extends CosemInterfaceClass {
    private scripts: Map<number, Script>;

    constructor(logicalName: ObisCode) {
        super(9, logicalName);
        this.scripts = new Map();

        // Register class attributes
        this.registerAttribute(1, 'logical_name', DataType.OCTET_STRING, false);
        this.registerAttribute(2, 'scripts', DataType.ARRAY, true);

        // Register class methods
        this.registerMethod(1, 'execute_script');
    }

    /**
     * Add script
     */
    public addScript(script: Script): void {
        if (this.scripts.has(script.id)) {
            throw new Error(`Script with id ${script.id} already exists`);
        }
        this.validateScript(script);
        this.scripts.set(script.id, script);
    }

    /**
     * Remove script
     */
    public removeScript(scriptId: number): void {
        if (!this.scripts.has(scriptId)) {
            throw new Error(`Script with id ${scriptId} does not exist`);
        }
        this.scripts.delete(scriptId);
    }

    /**
     * Get script
     */
    public getScript(scriptId: number): Script | undefined {
        return this.scripts.get(scriptId);
    }

    /**
     * Get all scripts
     */
    public getAllScripts(): Script[] {
        return Array.from(this.scripts.values());
    }

    /**
     * Execute script
     */
    public executeScript(scriptId: number, parameters?: any[]): void {
        const script = this.scripts.get(scriptId);
        if (!script) {
            throw new Error(`Script with id ${scriptId} does not exist`);
        }

        for (const action of script.actions) {
            this.executeAction(action, parameters);
        }
    }

    /**
     * Execute single action
     */
    private executeAction(action: ScriptAction, parameters?: any[]): void {
        // TODO: Implement actual action execution
        // This would involve:
        // 1. Finding the target object using classId and logicalName
        // 2. For WRITE actions: Setting the specified attribute
        // 3. For EXECUTE actions: Invoking the specified method
        // 4. Handling parameters appropriately
        console.log('Executing action:', action);
    }

    /**
     * Validate script
     */
    private validateScript(script: Script): void {
        if (!script.id || script.id < 0) {
            throw new Error('Invalid script id');
        }

        if (!Array.isArray(script.actions) || script.actions.length === 0) {
            throw new Error('Script must have at least one action');
        }

        for (const action of script.actions) {
            this.validateAction(action);
        }
    }

    /**
     * Validate action
     */
    private validateAction(action: ScriptAction): void {
        if (!action.type || !Object.values(ScriptActionType).includes(action.type)) {
            throw new Error('Invalid action type');
        }

        if (!action.objectId || !action.objectId.classId || !Array.isArray(action.objectId.logicalName)) {
            throw new Error('Invalid object identifier');
        }

        if (action.type === ScriptActionType.WRITE && !action.attributeId) {
            throw new Error('Write action must specify attribute id');
        }
    }

    /**
     * Handle get request
     */
    protected handleGet(attributeId: number): any {
        switch (attributeId) {
            case 1:
                return this.getLogicalName().toBuffer();
            case 2:
                return this.getAllScripts();
            default:
                throw new Error(`Invalid attribute id ${attributeId} for ScriptTable class`);
        }
    }

    /**
     * Handle set request
     */
    protected handleSet(attributeId: number, value: any): void {
        switch (attributeId) {
            case 1:
                throw new Error('Logical name is read-only');
            case 2:
                if (!Array.isArray(value)) {
                    throw new Error('Scripts must be an array');
                }
                this.scripts.clear();
                for (const script of value) {
                    this.addScript(script);
                }
                break;
            default:
                throw new Error(`Invalid attribute id ${attributeId} for ScriptTable class`);
        }
    }

    /**
     * Handle action request
     */
    protected handleAction(methodId: number, params?: any): void {
        switch (methodId) {
            case 1: // execute script
                if (!params || !params.scriptId) {
                    throw new Error('Execute script requires a script id parameter');
                }
                this.executeScript(params.scriptId, params.parameters);
                break;
            default:
                throw new Error(`Invalid method id ${methodId} for ScriptTable class`);
        }
    }
} 