import { Pool, PoolClient } from 'pg';

export class DatabaseManager {
    private static instance: DatabaseManager;
    private pool: Pool;

    private constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER || 'hes_user',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'hes_db',
            password: process.env.DB_PASSWORD || 'hes_password',
            port: parseInt(process.env.DB_PORT || '5433'),
        });
    }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    public async getConnection(): Promise<PoolClient> {
        return await this.pool.connect();
    }

    public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        const client = await this.getConnection();
        try {
            const result = await client.query(sql, params);
            return result.rows as T[];
        } finally {
            client.release();
        }
    }

    public async executeTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getConnection();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
} 