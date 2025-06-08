import { Pool } from 'pg';

async function countReadings() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Get total readings count
        const totalCount = await pool.query('SELECT COUNT(*) FROM meter_readings');
        console.log('\nTotal Readings:', totalCount.rows[0].count);

        // Get readings per meter
        const perMeter = await pool.query(`
            SELECT 
                m.meter_code,
                m.manufacturer,
                m.location,
                COUNT(r.*) as reading_count,
                MIN(r.reading_timestamp) as first_reading,
                MAX(r.reading_timestamp) as last_reading,
                ROUND(AVG(r.active_power_import)::numeric, 2) as avg_power_import,
                ROUND(AVG(r.voltage_r_phase)::numeric, 2) as avg_voltage
            FROM meters m
            LEFT JOIN meter_readings r ON r.meter_id = m.meter_id
            GROUP BY m.meter_id, m.meter_code, m.manufacturer, m.location
            ORDER BY m.meter_code
        `);

        console.log('\nReadings per Meter:');
        console.table(perMeter.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

countReadings(); 