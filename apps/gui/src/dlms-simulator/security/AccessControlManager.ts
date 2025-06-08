import { SecurityError } from './types';
import { SimulatorLogger } from '../core/monitoring/SimulatorLogger';
import { SecurityRepository } from './SecurityRepository';

export interface AccessRight {
    clientId: number;
    objectId: string;
    attributeMask: bigint;
    methodMask: bigint;
    accessLevel: AccessLevel;
}

export enum AccessLevel {
    NONE = 0,
    READ = 1,
    WRITE = 2,
    READ_WRITE = 3,
    ADMIN = 4
}

export class AccessControlManager {
    private static instance: AccessControlManager;
    private logger: SimulatorLogger;
    private repository: SecurityRepository;

    private constructor() {
        this.logger = SimulatorLogger.getInstance();
        this.repository = SecurityRepository.getInstance();
    }

    public static getInstance(): AccessControlManager {
        if (!AccessControlManager.instance) {
            AccessControlManager.instance = new AccessControlManager();
        }
        return AccessControlManager.instance;
    }

    /**
     * Check if client has required access rights
     */
    public async checkAccess(
        clientId: number,
        objectId: string,
        requiredLevel: AccessLevel,
        attributeIndex?: number,
        methodIndex?: number
    ): Promise<boolean> {
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
                const hasAttributeAccess = this.checkAttributeAccess(
                    rights.attributeMask,
                    attributeIndex,
                    requiredLevel
                );
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
                const hasMethodAccess = this.checkMethodAccess(
                    rights.methodMask,
                    methodIndex
                );
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
        } catch (err) {
            const error = err as Error;
            throw new SecurityError(`Failed to check access rights: ${error.message}`);
        }
    }

    /**
     * Grant access rights to a client
     */
    public async grantAccess(
        clientId: number,
        objectId: string,
        accessLevel: AccessLevel,
        attributeMask: bigint = 0n,
        methodMask: bigint = 0n
    ): Promise<void> {
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
        } catch (err) {
            const error = err as Error;
            throw new SecurityError(`Failed to grant access rights: ${error.message}`);
        }
    }

    /**
     * Revoke access rights from a client
     */
    public async revokeAccess(
        clientId: number,
        objectId: string
    ): Promise<void> {
        try {
            await this.repository.removeAccessRights(clientId, objectId);

            this.logSecurityEvent('ACCESS_RIGHTS_REVOKED', {
                clientId,
                objectId
            });
        } catch (err) {
            const error = err as Error;
            throw new SecurityError(`Failed to revoke access rights: ${error.message}`);
        }
    }

    /**
     * Check attribute access using bit mask
     */
    private checkAttributeAccess(
        attributeMask: bigint,
        attributeIndex: number,
        requiredLevel: AccessLevel
    ): boolean {
        const mask = 3n << BigInt(attributeIndex * 2); // 2 bits per attribute
        const access = (attributeMask & mask) >> BigInt(attributeIndex * 2);
        return access >= BigInt(requiredLevel);
    }

    /**
     * Check method access using bit mask
     */
    private checkMethodAccess(
        methodMask: bigint,
        methodIndex: number
    ): boolean {
        const mask = 1n << BigInt(methodIndex);
        return (methodMask & mask) !== 0n;
    }

    /**
     * Log security events
     */
    private logSecurityEvent(
        eventType: string,
        details: Record<string, any>
    ): void {
        this.logger.logSecurity('AccessControlManager', eventType, details);
    }
} 