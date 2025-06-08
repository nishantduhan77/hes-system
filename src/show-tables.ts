import { Pool } from 'pg';

async function showTables() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Show meters data
        console.log('\n=== METERS TABLE ===');
        const meters = await pool.query(`
            SELECT 
                meter_code,
                serial_number,
                manufacturer,
                model,
                meter_type,
                location,
                status,
                to_char(last_communication, 'YYYY-MM-DD HH24:MI:SS') as last_comm
            FROM meters
            ORDER BY meter_code
            LIMIT 5
        `);
        console.table(meters.rows);

        // Show meter readings
        console.log('\n=== METER READINGS TABLE ===');
        const readings = await pool.query(`
            SELECT 
                m.meter_code,
                to_char(r.reading_timestamp, 'YYYY-MM-DD HH24:MI:SS') as reading_time,
                ROUND(r.active_power_import::numeric, 2) as import_power,
                ROUND(r.active_power_export::numeric, 2) as export_power,
                ROUND(r.voltage_r_phase::numeric, 2) as voltage,
                ROUND(r.current_r_phase::numeric, 2) as current
            FROM meter_readings r
            JOIN meters m ON m.meter_id = r.meter_id
            ORDER BY r.reading_timestamp DESC
            LIMIT 5
        `);
        console.table(readings.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

showTables(); 