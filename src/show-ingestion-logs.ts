import { Pool } from 'pg';

async function showIngestionLogs() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Get ingestion timeline
        const timeline = await pool.query(`
            WITH time_analysis AS (
                SELECT 
                    meter_id,
                    MIN(reading_timestamp) as first_reading,
                    MAX(reading_timestamp) as last_reading,
                    COUNT(*) as total_readings,
                    COUNT(*) / NULLIF(EXTRACT(EPOCH FROM (MAX(reading_timestamp) - MIN(reading_timestamp)))/60, 0) as readings_per_minute
                FROM meter_readings
                GROUP BY meter_id
            )
            SELECT 
                m.meter_code,
                m.location,
                to_char(ta.first_reading, 'YYYY-MM-DD HH24:MI:SS.MS') as first_reading,
                to_char(ta.last_reading, 'YYYY-MM-DD HH24:MI:SS.MS') as last_reading,
                ta.total_readings,
                ROUND(ta.readings_per_minute::numeric, 2) as readings_per_minute
            FROM time_analysis ta
            JOIN meters m ON m.meter_id = ta.meter_id
            ORDER BY m.meter_code;
        `);

        console.log('\nIngestion Timeline per Meter:');
        console.log('============================');
        console.table(timeline.rows);

        // Get reading distribution over time
        const distribution = await pool.query(`
            WITH time_buckets AS (
                SELECT 
                    date_trunc('minute', reading_timestamp) as minute_bucket,
                    COUNT(*) as readings_in_minute,
                    COUNT(DISTINCT meter_id) as active_meters
                FROM meter_readings
                GROUP BY date_trunc('minute', reading_timestamp)
                ORDER BY minute_bucket
            )
            SELECT 
                to_char(minute_bucket, 'YYYY-MM-DD HH24:MI') as time_bucket,
                readings_in_minute,
                active_meters,
                CASE 
                    WHEN active_meters = 10 THEN 'All meters reporting'
                    WHEN active_meters >= 8 THEN 'Most meters reporting'
                    WHEN active_meters >= 5 THEN 'Partial reporting'
                    ELSE 'Low reporting'
                END as status
            FROM time_buckets
            ORDER BY minute_bucket;
        `);

        console.log('\nReading Distribution by Minute:');
        console.log('==============================');
        console.table(distribution.rows);

        // Get overall statistics
        const stats = await pool.query(`
            SELECT 
                COUNT(DISTINCT meter_id) as total_meters,
                COUNT(*) as total_readings,
                to_char(MIN(reading_timestamp), 'YYYY-MM-DD HH24:MI:SS.MS') as simulation_start,
                to_char(MAX(reading_timestamp), 'YYYY-MM-DD HH24:MI:SS.MS') as simulation_end,
                ROUND(EXTRACT(EPOCH FROM (MAX(reading_timestamp) - MIN(reading_timestamp)))/60::numeric, 2) as duration_minutes,
                ROUND(COUNT(*)::numeric / COUNT(DISTINCT meter_id), 2) as avg_readings_per_meter,
                ROUND(COUNT(*)::numeric / EXTRACT(EPOCH FROM (MAX(reading_timestamp) - MIN(reading_timestamp)))*60, 2) as avg_readings_per_minute
            FROM meter_readings;
        `);

        console.log('\nOverall Simulation Statistics:');
        console.log('============================');
        console.table(stats.rows);

        // Check for any gaps in readings
        const gaps = await pool.query(`
            WITH reading_gaps AS (
                SELECT 
                    meter_id,
                    reading_timestamp,
                    LAG(reading_timestamp) OVER (PARTITION BY meter_id ORDER BY reading_timestamp) as prev_reading,
                    EXTRACT(EPOCH FROM (
                        reading_timestamp - 
                        LAG(reading_timestamp) OVER (PARTITION BY meter_id ORDER BY reading_timestamp)
                    )) as gap_seconds
                FROM meter_readings
            )
            SELECT 
                m.meter_code,
                to_char(rg.prev_reading, 'YYYY-MM-DD HH24:MI:SS.MS') as gap_start,
                to_char(rg.reading_timestamp, 'YYYY-MM-DD HH24:MI:SS.MS') as gap_end,
                ROUND(rg.gap_seconds::numeric, 2) as gap_duration_seconds
            FROM reading_gaps rg
            JOIN meters m ON m.meter_id = rg.meter_id
            WHERE rg.gap_seconds > 10  -- Show gaps larger than 10 seconds
            ORDER BY rg.gap_seconds DESC
            LIMIT 10;
        `);

        if (gaps.rows.length > 0) {
            console.log('\nLargest Gaps in Readings:');
            console.log('========================');
            console.table(gaps.rows);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

showIngestionLogs(); 