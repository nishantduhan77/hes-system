/**
 * Script Action Type
 */
export enum ScriptActionType {
    WRITE = 1,
    EXECUTE = 2
}

/**
 * Script Action
 */
export interface ScriptAction {
    type: ScriptActionType;
    objectId: {
        classId: number;
        logicalName: number[];
    };
    attributeId?: number;  // Required for WRITE actions
    parameter?: any;       // Optional parameter for both action types
}

/**
 * Script Definition
 */
export interface Script {
    id: number;
    actions: ScriptAction[];
} 