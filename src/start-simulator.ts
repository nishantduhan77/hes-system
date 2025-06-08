import { DLMSSimulatorService } from './services/DLMSSimulatorService';

async function startSimulator() {
    try {
        // Get simulator instance
        const simulator = DLMSSimulatorService.getInstance();
        
        // Wait for initial meters to be generated
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get all meters from database
        const pool = new (await import('pg')).Pool({
            user: 'hes_user',
            host: 'localhost',
            database: 'hes_db',
            password: 'hes_password',
            port: 5433,
        });

        const result = await pool.query('SELECT meter_id FROM meters');
        
        // Start simulation for each meter
        for (const row of result.rows) {
            await simulator.startSimulation(row.meter_id);
            console.log(`Started simulation for meter ${row.meter_id}`);
        }

        console.log('Simulator running. Press Ctrl+C to stop.');
    } catch (error) {
        console.error('Error starting simulator:', error);
    }
}

startSimulator(); 