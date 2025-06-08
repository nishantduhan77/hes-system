import { Pool } from 'pg';

async function checkData() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Check meters
        const meters = await pool.query('SELECT meter_code, serial_number, manufacturer, model, status, last_communication FROM meters');
        console.log('\nMeters in database:', meters.rows.length);
        console.table(meters.rows);

        // Check recent readings
        const readings = await pool.query(`
            SELECT m.meter_code, r.timestamp, r.active_power_import, r.voltage_r_phase
            FROM meter_readings r
            JOIN meters m ON m.meter_id = r.meter_id
            ORDER BY r.timestamp DESC
            LIMIT 5
        `);
        console.log('\nMost recent readings:');
        console.table(readings.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkData(); 