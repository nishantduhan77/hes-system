import { Pool } from 'pg';

async function fixSchema() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Drop the existing tables and recreate with correct structure
        await pool.query(`
            DROP TABLE IF EXISTS meter_readings CASCADE;
            DROP TABLE IF EXISTS meters CASCADE;
            
            CREATE TABLE meters (
                meter_id UUID PRIMARY KEY,
                meter_code VARCHAR(50) NOT NULL,
                serial_number VARCHAR(50),
                manufacturer VARCHAR(100),
                model VARCHAR(100),
                meter_type VARCHAR(50),
                location TEXT,
                firmware_version VARCHAR(50),
                installation_date TIMESTAMP WITH TIME ZONE,
                status VARCHAR(20),
                last_communication TIMESTAMP WITH TIME ZONE
            );

            CREATE TABLE meter_readings (
                reading_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                meter_id UUID REFERENCES meters(meter_id),
                reading_timestamp TIMESTAMP WITH TIME ZONE,
                active_power_import DECIMAL,
                active_power_export DECIMAL,
                voltage_r_phase DECIMAL,
                current_r_phase DECIMAL
            );
        `);

        console.log('Schema fixed successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

fixSchema(); 