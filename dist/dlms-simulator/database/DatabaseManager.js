"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const pg_1 = require("pg");
class DatabaseManager {
    constructor() {
        this.pool = new pg_1.Pool({
            user: process.env.DB_USER || 'hes_user',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'hes_db',
            password: process.env.DB_PASSWORD || 'hes_password',
            port: parseInt(process.env.DB_PORT || '5433'),
        });
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    async getConnection() {
        return await this.pool.connect();
    }
    async query(sql, params = []) {
        const client = await this.getConnection();
        try {
            const result = await client.query(sql, params);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    async executeTransaction(callback) {
        const client = await this.getConnection();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.DatabaseManager = DatabaseManager;
