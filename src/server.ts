import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const port = 3001; // Using 3001 since React will use 3000

// Database connection
const pool = new Pool({
    user: 'hes_user',
    host: 'localhost',
    database: 'hes_db',
    password: 'hes_password',
    port: 5433,
});

app.use(cors());
app.use(express.json());

// Get all meters
app.get('/api/meters', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                meter_id,
                meter_code,
                serial_number,
                manufacturer,
                model,
                meter_type,
                location,
                status,
                to_char(last_communication, 'YYYY-MM-DD HH24:MI:SS') as last_communication
            FROM meters
            ORDER BY meter_code
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching meters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get latest readings for a specific meter
app.get('/api/meters/:meterId/readings', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                reading_id,
                to_char(reading_timestamp, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
                ROUND(active_power_import::numeric, 2) as active_power_import,
                ROUND(active_power_export::numeric, 2) as active_power_export,
                ROUND(voltage_r_phase::numeric, 2) as voltage_r_phase,
                ROUND(current_r_phase::numeric, 2) as current_r_phase
            FROM meter_readings
            WHERE meter_id = $1
            ORDER BY reading_timestamp DESC
            LIMIT 10
        `, [req.params.meterId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching readings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get latest readings for all meters
app.get('/api/readings/latest', async (req, res) => {
    try {
        const result = await pool.query(`
            WITH LatestReadings AS (
                SELECT DISTINCT ON (meter_id)
                    meter_id,
                    reading_timestamp,
                    active_power_import,
                    active_power_export,
                    voltage_r_phase,
                    current_r_phase
                FROM meter_readings
                ORDER BY meter_id, reading_timestamp DESC
            )
            SELECT 
                m.meter_code,
                m.location,
                to_char(lr.reading_timestamp, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
                ROUND(lr.active_power_import::numeric, 2) as active_power_import,
                ROUND(lr.active_power_export::numeric, 2) as active_power_export,
                ROUND(lr.voltage_r_phase::numeric, 2) as voltage_r_phase,
                ROUND(lr.current_r_phase::numeric, 2) as current_r_phase
            FROM LatestReadings lr
            JOIN meters m ON m.meter_id = lr.meter_id
            ORDER BY m.meter_code;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching latest readings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 