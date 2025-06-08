"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlManager = exports.AccessLevel = void 0;
const types_1 = require("./types");
const SimulatorLogger_1 = require("../core/monitoring/SimulatorLogger");
const SecurityRepository_1 = require("./SecurityRepository");
var AccessLevel;
(function (AccessLevel) {
    AccessLevel[AccessLevel["NONE"] = 0] = "NONE";
    AccessLevel[AccessLevel["READ"] = 1] = "READ";
    AccessLevel[AccessLevel["WRITE"] = 2] = "WRITE";
    AccessLevel[AccessLevel["READ_WRITE"] = 3] = "READ_WRITE";
    AccessLevel[AccessLevel["ADMIN"] = 4] = "ADMIN";
})(AccessLevel || (exports.AccessLevel = AccessLevel = {}));
class AccessControlManager {
    constructor() {
        this.logger = SimulatorLogger_1.SimulatorLogger.getInstance();
        this.repository = SecurityRepository_1.SecurityRepository.getInstance();
    }
    static getInstance() {
        if (!AccessControlManager.instance) {
            AccessControlManager.instance = new AccessControlManager();
        }
        return AccessControlManager.instance;
    }
    /**
     * Check if client has required access rights
     */
    async checkAccess(clientId, objectId, requiredLevel, attributeIndex, methodIndex) {
        try {
            const rights = await this.repository.getAccessRights(clientId, objectId);
            if (!rights) {
                this.logSecurityEvent('ACCESS_DENIED', {
                    clientId,
                    objectId,
                    requiredLevel,
                    reason: 'No access rights found'
                });
                return false;
            }
            // Check access level
            if (rights.accessLevel < requiredLevel) {
                this.logSecurityEvent('ACCESS_DENIED', {
                    clientId,
                    objectId,
                    requiredLevel,
                    actualLevel: rights.accessLevel,
                    reason: 'Insufficient access level'
                });
                return false;
            }
            // Check attribute access if specified
            if (attributeIndex !== undefined) {
                const hasAttributeAccess = this.checkAttributeAccess(rights.attributeMask, attributeIndex, requiredLevel);
                if (!hasAttributeAccess) {
                    this.logSecurityEvent('ACCESS_DENIED', {
                        clientId,
                        objectId,
                        attributeIndex,
                        reason: 'Attribute access denied'
                    });
                    return false;
                }
            }
            // Check method access if specified
            if (methodIndex !== undefined) {
                const hasMethodAccess = this.checkMethodAccess(rights.methodMask, methodIndex);
                if (!hasMethodAccess) {
                    this.logSecurityEvent('ACCESS_DENIED', {
                        clientId,
                        objectId,
                        methodIndex,
                        reason: 'Method access denied'
                    });
                    return false;
                }
            }
            this.logSecurityEvent('ACCESS_GRANTED', {
                clientId,
                objectId,
                requiredLevel,
                attributeIndex,
                methodIndex
            });
            return true;
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to check access rights: ${error.message}`);
        }
    }
    /**
     * Grant access rights to a client
     */
    async grantAccess(clientId, objectId, accessLevel, attributeMask = 0n, methodMask = 0n) {
        try {
            await this.repository.setAccessRights({
                clientId,
                objectId,
                accessLevel,
                attributeMask,
                methodMask
            });
            this.logSecurityEvent('ACCESS_RIGHTS_GRANTED', {
                clientId,
                objectId,
                accessLevel,
                attributeMask: attributeMask.toString(),
                methodMask: methodMask.toString()
            });
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to grant access rights: ${error.message}`);
        }
    }
    /**
     * Revoke access rights from a client
     */
    async revokeAccess(clientId, objectId) {
        try {
            await this.repository.removeAccessRights(clientId, objectId);
            this.logSecurityEvent('ACCESS_RIGHTS_REVOKED', {
                clientId,
                objectId
            });
        }
        catch (err) {
            const error = err;
            throw new types_1.SecurityError(`Failed to revoke access rights: ${error.message}`);
        }
    }
    /**
     * Check attribute access using bit mask
     */
    checkAttributeAccess(attributeMask, attributeIndex, requiredLevel) {
        const mask = 3n << BigInt(attributeIndex * 2); // 2 bits per attribute
        const access = (attributeMask & mask) >> BigInt(attributeIndex * 2);
        return access >= BigInt(requiredLevel);
    }
    /**
     * Check method access using bit mask
     */
    checkMethodAccess(methodMask, methodIndex) {
        const mask = 1n << BigInt(methodIndex);
        return (methodMask & mask) !== 0n;
    }
    /**
     * Log security events
     */
    logSecurityEvent(eventType, details) {
        this.logger.logSecurity('AccessControlManager', eventType, details);
    }
}
exports.AccessControlManager = AccessControlManager;
