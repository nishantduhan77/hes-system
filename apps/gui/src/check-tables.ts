import { Pool } from 'pg';

async function checkTables() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Check meters table
        console.log('\nMeters Table Content:');
        console.log('====================');
        const metersResult = await pool.query(`
            SELECT 
                meter_id,
                meter_code,
                serial_number,
                location,
                manufacturer,
                model,
                to_char(installation_date, 'YYYY-MM-DD HH24:MI:SS') as installation_date,
                status
            FROM meters
            ORDER BY meter_id;
        `);
        console.table(metersResult.rows);

        // Check meter_readings table sample
        console.log('\nMeter Readings Table Sample (10 recent readings):');
        console.log('============================================');
        const readingsResult = await pool.query(`
            SELECT 
                reading_id,
                meter_id,
                to_char(reading_timestamp, 'YYYY-MM-DD HH24:MI:SS.MS') as reading_timestamp,
                active_power_import,
                active_power_export,
                voltage_r_phase,
                current_r_phase
            FROM meter_readings
            ORDER BY reading_timestamp DESC
            LIMIT 10;
        `);
        console.table(readingsResult.rows);

        // Get table statistics
        console.log('\nTable Statistics:');
        console.log('================');
        const statsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM meters) as total_meters,
                (SELECT COUNT(*) FROM meter_readings) as total_readings,
                (SELECT COUNT(*) FROM meter_readings WHERE reading_timestamp >= NOW() - INTERVAL '1 hour') as readings_last_hour,
                (SELECT pg_size_pretty(pg_total_relation_size('meter_readings')) as table_size) as readings_table_size,
                (SELECT pg_size_pretty(pg_total_relation_size('meters')) as table_size) as meters_table_size;
        `);
        console.table(statsResult.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkTables(); 