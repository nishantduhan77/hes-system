"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationLN = void 0;
const CosemInterfaceClass_1 = require("./CosemInterfaceClass");
const Types_1 = require("../data/Types");
/**
 * Association LN Class (IC: 15)
 * Manages logical name referencing association
 */
class AssociationLN extends CosemInterfaceClass_1.CosemInterfaceClass {
    constructor(logicalName, clientSAP = 16, serverSAP = 1) {
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
        this.authenticationMechanism = Types_1.AuthenticationType.NONE;
        this.securitySetupReference = null;
        this.accessRights = new Map();
        this.securityLevel = Types_1.SecurityLevel.NONE;
        this.associationStatus = 0; // Not connected
        this.initializeAttributes();
    }
    initializeAttributes() {
        // Attribute 2: object_list
        this.addAttribute(2, {
            name: 'object_list',
            type: 'array',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.objectList
        });
        // Attribute 3: associated_partners_id
        this.addAttribute(3, {
            name: 'associated_partners_id',
            type: 'structure',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => ({
                clientSAP: this.clientSAP,
                serverSAP: this.serverSAP
            })
        });
        // Attribute 4: application_context_name
        this.addAttribute(4, {
            name: 'application_context_name',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.applicationContextName
        });
        // Attribute 5: xDLMS_context_info
        this.addAttribute(5, {
            name: 'xdlms_context_info',
            type: 'structure',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.xDLMSContextInfo
        });
        // Attribute 6: authentication_mechanism_name
        this.addAttribute(6, {
            name: 'authentication_mechanism_name',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.authenticationMechanism
        });
        // Attribute 7: secret
        this.addAttribute(7, {
            name: 'secret',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_WRITE,
            getValue: () => null, // Secret is never readable
            setValue: (value) => {
                // Handle secret update
            }
        });
        // Attribute 8: association_status
        this.addAttribute(8, {
            name: 'association_status',
            type: 'enum',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.associationStatus
        });
        // Attribute 9: security_setup_reference
        this.addAttribute(9, {
            name: 'security_setup_reference',
            type: 'octet-string',
            access: Types_1.AccessLevel.READ_ONLY,
            getValue: () => this.securitySetupReference?.toString() || null
        });
        // Add reply_to_HLS_authentication method
        this.addMethod(1, {
            name: 'reply_to_HLS_authentication',
            execute: (serverChallenge) => this.replyToHlsAuthentication(serverChallenge)
        });
        // Add change_HLS_secret method
        this.addMethod(2, {
            name: 'change_HLS_secret',
            execute: (newSecret) => this.changeHlsSecret(newSecret)
        });
    }
    getDefaultConformance() {
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
    addObject(object) {
        this.objectList.push(object);
    }
    /**
     * Remove an object from the association
     */
    removeObject(logicalName) {
        this.objectList = this.objectList.filter(obj => obj.logicalName !== logicalName);
    }
    /**
     * Set access rights for an object
     */
    setAccessRights(logicalName, rights) {
        this.accessRights.set(logicalName, rights);
    }
    /**
     * Get access rights for an object
     */
    getAccessRights(logicalName) {
        return this.accessRights.get(logicalName);
    }
    /**
     * Update association status
     */
    updateAssociationStatus(status) {
        this.associationStatus = status;
    }
    /**
     * Reply to HLS authentication
     */
    replyToHlsAuthentication(serverChallenge) {
        // In real implementation, this would process the challenge
        // and return appropriate response based on authentication type
        return Buffer.alloc(0);
    }
    /**
     * Change HLS secret
     */
    changeHlsSecret(newSecret) {
        // In real implementation, this would update the secret
        // after proper validation
    }
    /**
     * Convert to string representation
     */
    toString() {
        return `Association LN (Client SAP: ${this.clientSAP}, Server SAP: ${this.serverSAP})`;
    }
}
exports.AssociationLN = AssociationLN;
