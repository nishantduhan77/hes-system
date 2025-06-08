"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityRepository = void 0;
const DatabaseManager_1 = require("../database/DatabaseManager");
class SecurityRepository {
    constructor() {
        this.dbManager = DatabaseManager_1.DatabaseManager.getInstance();
    }
    static getInstance() {
        if (!SecurityRepository.instance) {
            SecurityRepository.instance = new SecurityRepository();
        }
        return SecurityRepository.instance;
    }
    /**
     * Store security settings
     */
    async storeSecuritySettings(settings) {
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
        const result = await this.dbManager.query(sql, params);
        return result[0];
    }
    /**
     * Update key change timestamp
     */
    async updateKeyChangeTimestamp() {
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
    async storeCertificate(cert) {
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
        const result = await this.dbManager.query(sql, params);
        return result[0];
    }
    /**
     * Get certificate by ID
     */
    async getCertificateById(id) {
        const sql = `
            SELECT * FROM certificates 
            WHERE id = $1
        `;
        const result = await this.dbManager.query(sql, [id]);
        return result[0] || null;
    }
    /**
     * Revoke certificate
     */
    async revokeCertificate(id) {
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
    async getActiveCertificates(entityId) {
        const sql = `
            SELECT * FROM certificates 
            WHERE entity_id = $1 
            AND status = 'ACTIVE'
            AND valid_until > NOW()
        `;
        return await this.dbManager.query(sql, [entityId]);
    }
    /**
     * Get latest security settings
     */
    async getLatestSecuritySettings() {
        const sql = `
            SELECT * FROM security_settings 
            ORDER BY id DESC 
            LIMIT 1
        `;
        const result = await this.dbManager.query(sql);
        return result[0] || null;
    }
    /**
     * Get access rights for a client and object
     */
    async getAccessRights(clientId, objectId) {
        const sql = `
            SELECT * FROM access_rights 
            WHERE client_id = $1 AND object_id = $2
        `;
        const result = await this.dbManager.query(sql, [clientId, objectId]);
        return result[0] || null;
    }
    /**
     * Set access rights for a client
     */
    async setAccessRights(rights) {
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
    async removeAccessRights(clientId, objectId) {
        const sql = `
            DELETE FROM access_rights 
            WHERE client_id = $1 AND object_id = $2
        `;
        await this.dbManager.query(sql, [clientId, objectId]);
    }
}
exports.SecurityRepository = SecurityRepository;
