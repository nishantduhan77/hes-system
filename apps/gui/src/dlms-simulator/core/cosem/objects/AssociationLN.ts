import { CosemInterfaceClass } from './CosemInterfaceClass';
import { ObisCode } from '../obis/ObisCode';
import { AccessLevel, AuthenticationType, SecurityLevel, ConformanceBlock } from '../data/Types';

interface ObjectDefinition {
    classId: number;
    version: number;
    logicalName: string;
}

interface AccessRight {
    attributeAccess: Map<number, AccessLevel>;
    methodAccess: Map<number, boolean>;
}

/**
 * Association LN Class (IC: 15)
 * Manages logical name referencing association
 */
export class AssociationLN extends CosemInterfaceClass {
    private objectList: ObjectDefinition[];
    private clientSAP: number;
    private serverSAP: number;
    private applicationContextName: string;
    private xDLMSContextInfo: {
        conformance: ConformanceBlock;
        maxReceivePduSize: number;
        maxSendPduSize: number;
        dlmsVersionNumber: number;
        qualityOfService: number;
        cypheringInfo: Buffer | null;
    };
    private authenticationMechanism: AuthenticationType;
    private securitySetupReference: ObisCode | null;
    private accessRights: Map<string, AccessRight>;
    private securityLevel: SecurityLevel;
    private associationStatus: number;

    constructor(
        logicalName: ObisCode,
        clientSAP: number = 16,
        serverSAP: number = 1
    ) {
        super(logicalName, 15);
        this.objectList = [];
        this.clientSAP = clientSAP;
        this.serverSAP = serverSAP;
        this.applicationContextName = 'LN';
        this.xDLMSContextInfo = {
            conformance: this.getDefaultConformance(),
            maxReceivePduSize: 1024,
            maxSendPduSize: 1024,
            dlmsVersionNumber: 6,
            qualityOfService: 0,
            cypheringInfo: null
        };
        this.authenticationMechanism = AuthenticationType.NONE;
        this.securitySetupReference = null;
        this.accessRights = new Map();
        this.securityLevel = SecurityLevel.NONE;
        this.associationStatus = 0; // Not connected
        this.initializeAttributes();
    }

    private initializeAttributes(): void {
        // Attribute 2: object_list
        this.addAttribute(2, {
            name: 'object_list',
            type: 'array',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.objectList
        });

        // Attribute 3: associated_partners_id
        this.addAttribute(3, {
            name: 'associated_partners_id',
            type: 'structure',
            access: AccessLevel.READ_ONLY,
            getValue: () => ({
                clientSAP: this.clientSAP,
                serverSAP: this.serverSAP
            })
        });

        // Attribute 4: application_context_name
        this.addAttribute(4, {
            name: 'application_context_name',
            type: 'octet-string',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.applicationContextName
        });

        // Attribute 5: xDLMS_context_info
        this.addAttribute(5, {
            name: 'xdlms_context_info',
            type: 'structure',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.xDLMSContextInfo
        });

        // Attribute 6: authentication_mechanism_name
        this.addAttribute(6, {
            name: 'authentication_mechanism_name',
            type: 'octet-string',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.authenticationMechanism
        });

        // Attribute 7: secret
        this.addAttribute(7, {
            name: 'secret',
            type: 'octet-string',
            access: AccessLevel.READ_WRITE,
            getValue: () => null, // Secret is never readable
            setValue: (value: Buffer) => {
                // Handle secret update
            }
        });

        // Attribute 8: association_status
        this.addAttribute(8, {
            name: 'association_status',
            type: 'enum',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.associationStatus
        });

        // Attribute 9: security_setup_reference
        this.addAttribute(9, {
            name: 'security_setup_reference',
            type: 'octet-string',
            access: AccessLevel.READ_ONLY,
            getValue: () => this.securitySetupReference?.toString() || null
        });

        // Add reply_to_HLS_authentication method
        this.addMethod(1, {
            name: 'reply_to_HLS_authentication',
            execute: (serverChallenge: Buffer) => this.replyToHlsAuthentication(serverChallenge)
        });

        // Add change_HLS_secret method
        this.addMethod(2, {
            name: 'change_HLS_secret',
            execute: (newSecret: Buffer) => this.changeHlsSecret(newSecret)
        });
    }

    private getDefaultConformance(): ConformanceBlock {
        return {
            general: true,
            generalProtection: false,
            generalEstablishment: false,
            generalEstablishmentNoAck: false,
            generalReleaseNoAck: false,
            generalPriority: false,
            generalBlockTransfer: true,
            generalBlockTransferWithGet: true,
            generalBlockTransferWithSet: true,
            generalActionBlockTransfer: true,
            generalMultipleReferences: true,
            generalDataNotification: true,
            generalAccessNoResponse: false,
            generalUnitaryManagement: true,
            generalAttributeGet: true,
            generalAttributeSet: true,
            generalAttributeSetMultiple: true,
            generalMethodInvoke: true,
            generalSelectiveAccess: true,
            generalEventNotification: true,
            generalInformationReport: false
        };
    }

    /**
     * Add an object to the association
     */
    public addObject(object: ObjectDefinition): void {
        this.objectList.push(object);
    }

    /**
     * Remove an object from the association
     */
    public removeObject(logicalName: string): void {
        this.objectList = this.objectList.filter(obj => obj.logicalName !== logicalName);
    }

    /**
     * Set access rights for an object
     */
    public setAccessRights(logicalName: string, rights: AccessRight): void {
        this.accessRights.set(logicalName, rights);
    }

    /**
     * Get access rights for an object
     */
    public getAccessRights(logicalName: string): AccessRight | undefined {
        return this.accessRights.get(logicalName);
    }

    /**
     * Update association status
     */
    public updateAssociationStatus(status: number): void {
        this.associationStatus = status;
    }

    /**
     * Reply to HLS authentication
     */
    private replyToHlsAuthentication(serverChallenge: Buffer): Buffer {
        // In real implementation, this would process the challenge
        // and return appropriate response based on authentication type
        return Buffer.alloc(0);
    }

    /**
     * Change HLS secret
     */
    private changeHlsSecret(newSecret: Buffer): void {
        // In real implementation, this would update the secret
        // after proper validation
    }

    /**
     * Convert to string representation
     */
    public toString(): string {
        return `Association LN (Client SAP: ${this.clientSAP}, Server SAP: ${this.serverSAP})`;
    }
} 