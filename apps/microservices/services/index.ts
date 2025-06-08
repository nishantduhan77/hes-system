import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { DLMSSimulatorService } from '../src/services/DLMSSimulatorService';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    user: 'hes_user',
    host: 'localhost',
    database: 'hes_db',
    password: 'hes_password',
    port: 5433,
});

// Initialize simulator service
const simulator = DLMSSimulatorService.getInstance();

// API Routes
app.get('/api/meters', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meters ORDER BY installation_date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching meters:', err);
        res.status(500).json({ error: 'Failed to fetch meters' });
    }
});

app.get('/api/meters/:meterId/readings', async (req, res) => {
    try {
        const { meterId } = req.params;
        const result = await pool.query(
            'SELECT * FROM power_readings WHERE meter_id = $1 ORDER BY timestamp DESC LIMIT 30',
            [meterId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching readings:', err);
        res.status(500).json({ error: 'Failed to fetch readings' });
    }
});

app.post('/api/meters', async (req, res) => {
    try {
        const { serialNumber, manufacturer, model } = req.body;
        const meterId = await simulator.addMeter(serialNumber, manufacturer, model);
        res.json({ meterId });
    } catch (err) {
        console.error('Error adding meter:', err);
        res.status(500).json({ error: 'Failed to add meter' });
    }
});

app.post('/api/meters/:meterId/connect', async (req, res) => {
    try {
        const { meterId } = req.params;
        await simulator.startSimulation(meterId);
        res.json({ success: true });
    } catch (err) {
        console.error('Error connecting meter:', err);
        res.status(500).json({ error: 'Failed to connect meter' });
    }
});

app.post('/api/meters/:meterId/disconnect', async (req, res) => {
    try {
        const { meterId } = req.params;
        await simulator.stopSimulation(meterId);
        res.json({ success: true });
    } catch (err) {
        console.error('Error disconnecting meter:', err);
        res.status(500).json({ error: 'Failed to disconnect meter' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    await simulator.cleanup();
    process.exit(0);
}); 