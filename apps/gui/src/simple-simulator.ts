import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

async function startSimulator() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes_db',
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Generate initial meters if none exist
        const meterCount = await pool.query('SELECT COUNT(*) FROM meters');
        
        if (parseInt(meterCount.rows[0].count) === 0) {
            console.log('Generating initial meters...');
            const manufacturers = ['L&T', 'Secure Meters', 'Genus', 'HPL'];
            const models = ['Elite 300', 'Smart 100', 'Pro 200'];
            const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'];
            const meterTypes = ['Single Phase', 'Three Phase'];
            
            // Generate 10 meters
            for (let i = 0; i < 10; i++) {
                const meterId = uuidv4();
                const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
                const model = models[Math.floor(Math.random() * models.length)];
                const location = locations[Math.floor(Math.random() * locations.length)];
                const meterType = meterTypes[Math.floor(Math.random() * meterTypes.length)];
                const meterCode = `MC${String(i + 1).padStart(8, '0')}`;
                const serialNumber = `SN${String(i + 1).padStart(8, '0')}`;
                
                await pool.query(
                    `INSERT INTO meters (
                        meter_id, meter_code, serial_number, manufacturer, model,
                        meter_type, location, firmware_version,
                        installation_date, status, last_communication
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        meterId, meterCode, serialNumber, manufacturer, model,
                        meterType, location, '1.0.0',
                        new Date(), 'CONNECTED', new Date()
                    ]
                );
                console.log(`Created meter ${meterCode} (${serialNumber})`);
            }
        }

        // Start generating readings
        console.log('Starting to generate readings...');
        
        setInterval(async () => {
            const meters = await pool.query('SELECT meter_id FROM meters');
            
            for (const meter of meters.rows) {
                const timestamp = new Date();
                const readings = {
                    active_power_import: 200 + Math.random() * 1800, // 200W to 2kW
                    active_power_export: Math.random() * 500,        // 0W to 500W
                    voltage_r_phase: 220 + Math.random() * 20,       // 220V to 240V
                    current_r_phase: 1 + Math.random() * 9           // 1A to 10A
                };

                // Insert into meter_readings table
                await pool.query(
                    `INSERT INTO meter_readings (
                        meter_id, reading_timestamp,
                        active_power_import, active_power_export,
                        voltage_r_phase, current_r_phase
                    ) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        meter.meter_id, timestamp,
                        readings.active_power_import, readings.active_power_export,
                        readings.voltage_r_phase, readings.current_r_phase
                    ]
                );

                // Update last communication time
                await pool.query(
                    'UPDATE meters SET last_communication = $1, status = $2 WHERE meter_id = $3',
                    [timestamp, 'CONNECTED', meter.meter_id]
                );
            }
            
            console.log(`Generated readings at ${new Date().toISOString()}`);
        }, 5000); // Generate readings every 5 seconds

        console.log('Simulator running. Press Ctrl+C to stop.');
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

startSimulator(); 