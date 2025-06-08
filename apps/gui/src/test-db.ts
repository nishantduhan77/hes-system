import { Pool } from 'pg';

async function testConnection() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Test connection
        console.log('Testing database connection...');
        const result = await pool.query('SELECT NOW()');
        console.log('Connection successful! Server time:', result.rows[0].now);

        // List all tables
        console.log('\nListing all tables:');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found:', tables.rows.map(row => row.table_name));

        // For the first table, show its structure
        if (tables.rows.length > 0) {
            const firstTable = tables.rows[0].table_name;
            console.log(`\nStructure of table ${firstTable}:`);
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [firstTable]);
            console.log('Columns:', columns.rows);
        }

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await pool.end();
    }
}

testConnection(); 