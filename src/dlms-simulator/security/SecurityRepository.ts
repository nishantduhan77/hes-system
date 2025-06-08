import { DatabaseManager } from '../database/DatabaseManager';
import { SecuritySettings, SecurityPolicy, SecuritySuite, Certificate, CertificateType } from './types';
import { AccessRight } from './AccessControlManager';

export class SecurityRepository {
    private static instance: SecurityRepository;
    private dbManager: DatabaseManager;

    private constructor() {
        this.dbManager = DatabaseManager.getInstance();
    }

    public static getInstance(): SecurityRepository {
        if (!SecurityRepository.instance) {
            SecurityRepository.instance = new SecurityRepository();
        }
        return SecurityRepository.instance;
    }

    /**
     * Store security settings
     */
    public async storeSecuritySettings(settings: Omit<SecuritySettings, 'id' | 'createdAt'>): Promise<SecuritySettings> {
        const sql = `
            INSERT INTO security_settings (
                security_policy, security_suite, encryption_key, 
                authentication_key, master_key, global_key_change_interval,
                last_key_change
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const params = [
            settings.securityPolicy,
            settings.securitySuite,
            settings.encryptionKey,
            settings.authenticationKey,
            settings.masterKey,
            settings.globalKeyChangeInterval,
            settings.lastKeyChange
        ];

        const result = await this.dbManager.query<SecuritySettings>(sql, params);
        return result[0];
    }

    /**
     * Update key change timestamp
     */
    public async updateKeyChangeTimestamp(): Promise<void> {
        const sql = `
            UPDATE security_settings 
            SET last_key_change = NOW()
            WHERE id = (SELECT MAX(id) FROM security_settings)
        `;

        await this.dbManager.query(sql);
    }

    /**
     * Store certificate
     */
    public async storeCertificate(cert: Omit<Certificate, 'id' | 'createdAt' | 'status'>): Promise<Certificate> {
        const sql = `
            INSERT INTO certificates (
                entity_id, certificate_type, certificate_data,
                valid_from, valid_until, status
            ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
            RETURNING *
        `;

        const params = [
            cert.entityId,
            cert.certificateType,
            cert.certificateData,
            cert.validFrom,
            cert.validUntil
        ];

        const result = await this.dbManager.query<Certificate>(sql, params);
        return result[0];
    }

    /**
     * Get certificate by ID
     */
    public async getCertificateById(id: number): Promise<Certificate | null> {
        const sql = `
            SELECT * FROM certificates 
            WHERE id = $1
        `;

        const result = await this.dbManager.query<Certificate>(sql, [id]);
        return result[0] || null;
    }

    /**
     * Revoke certificate
     */
    public async revokeCertificate(id: number): Promise<void> {
        const sql = `
            UPDATE certificates 
            SET status = 'REVOKED'
            WHERE id = $1
        `;

        await this.dbManager.query(sql, [id]);
    }

    /**
     * Get active certificates for entity
     */
    public async getActiveCertificates(entityId: number): Promise<Certificate[]> {
        const sql = `
            SELECT * FROM certificates 
            WHERE entity_id = $1 
            AND status = 'ACTIVE'
            AND valid_until > NOW()
        `;

        return await this.dbManager.query<Certificate>(sql, [entityId]);
    }

    /**
     * Get latest security settings
     */
    public async getLatestSecuritySettings(): Promise<SecuritySettings | null> {
        const sql = `
            SELECT * FROM security_settings 
            ORDER BY id DESC 
            LIMIT 1
        `;

        const result = await this.dbManager.query<SecuritySettings>(sql);
        return result[0] || null;
    }

    /**
     * Get access rights for a client and object
     */
    public async getAccessRights(
        clientId: number,
        objectId: string
    ): Promise<AccessRight | null> {
        const sql = `
            SELECT * FROM access_rights 
            WHERE client_id = $1 AND object_id = $2
        `;

        const result = await this.dbManager.query<AccessRight>(sql, [clientId, objectId]);
        return result[0] || null;
    }

    /**
     * Set access rights for a client
     */
    public async setAccessRights(rights: AccessRight): Promise<void> {
        const sql = `
            INSERT INTO access_rights (
                client_id, 
                object_id, 
                access_level, 
                attribute_mask, 
                method_mask
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (client_id, object_id) 
            DO UPDATE SET 
                access_level = $3,
                attribute_mask = $4,
                method_mask = $5
        `;

        await this.dbManager.query(sql, [
            rights.clientId,
            rights.objectId,
            rights.accessLevel,
            rights.attributeMask,
            rights.methodMask
        ]);
    }

    /**
     * Remove access rights for a client
     */
    public async removeAccessRights(
        clientId: number,
        objectId: string
    ): Promise<void> {
        const sql = `
            DELETE FROM access_rights 
            WHERE client_id = $1 AND object_id = $2
        `;

        await this.dbManager.query(sql, [clientId, objectId]);
    }
} 