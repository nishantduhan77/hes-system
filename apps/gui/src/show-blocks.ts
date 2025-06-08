import { Pool } from 'pg';

async function showBlocks() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Get 15-minute block data
        const blockData = await pool.query(`
            WITH blocks AS (
                SELECT 
                    meter_id,
                    date_trunc('hour', reading_timestamp) + 
                    INTERVAL '15 min' * (date_part('minute', reading_timestamp)::integer / 15) as block_start,
                    date_trunc('hour', reading_timestamp) + 
                    INTERVAL '15 min' * (date_part('minute', reading_timestamp)::integer / 15) + 
                    INTERVAL '15 min' as block_end,
                    ROUND(AVG(active_power_import)::numeric, 2) as avg_import_power,
                    ROUND(AVG(active_power_export)::numeric, 2) as avg_export_power,
                    ROUND(AVG(voltage_r_phase)::numeric, 2) as avg_voltage,
                    ROUND(AVG(current_r_phase)::numeric, 2) as avg_current,
                    COUNT(*) as readings_count
                FROM meter_readings
                GROUP BY 
                    meter_id,
                    date_trunc('hour', reading_timestamp) + 
                    INTERVAL '15 min' * (date_part('minute', reading_timestamp)::integer / 15)
            )
            SELECT 
                m.meter_code,
                m.location,
                to_char(b.block_start, 'YYYY-MM-DD HH24:MI') as block_start,
                to_char(b.block_end, 'YYYY-MM-DD HH24:MI') as block_end,
                b.avg_import_power,
                b.avg_export_power,
                b.avg_voltage,
                b.avg_current,
                b.readings_count
            FROM blocks b
            JOIN meters m ON m.meter_id = b.meter_id
            ORDER BY b.block_start, m.meter_code;
        `);

        console.log('\n15-Minute Block Data:');
        console.log('===================');
        console.table(blockData.rows);

        // Get summary statistics
        const summary = await pool.query(`
            SELECT 
                COUNT(DISTINCT meter_id) as total_meters,
                COUNT(DISTINCT (
                    date_trunc('hour', reading_timestamp) + 
                    INTERVAL '15 min' * (date_part('minute', reading_timestamp)::integer / 15)
                )) as total_blocks,
                ROUND(AVG(active_power_import)::numeric, 2) as overall_avg_import,
                ROUND(MAX(active_power_import)::numeric, 2) as max_import,
                ROUND(MIN(active_power_import)::numeric, 2) as min_import
            FROM meter_readings;
        `);

        console.log('\nSummary Statistics:');
        console.log('==================');
        console.log('Total Meters:', summary.rows[0].total_meters);
        console.log('Total 15-min Blocks:', summary.rows[0].total_blocks);
        console.log('Overall Average Import Power:', summary.rows[0].overall_avg_import, 'W');
        console.log('Maximum Import Power:', summary.rows[0].max_import, 'W');
        console.log('Minimum Import Power:', summary.rows[0].min_import, 'W');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

showBlocks(); 