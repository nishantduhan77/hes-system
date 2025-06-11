import { Pool } from 'pg';

async function startSimulator() {
    const pool = new Pool({
        user: 'hes_user',
        host: 'localhost',
        database: 'hes',  // Updated database name
        password: 'hes_password',
        port: 5433,
    });

    try {
        // Generate initial meters if none exist
        const meterCount = await pool.query('SELECT COUNT(*) FROM meters');
        
        if (parseInt(meterCount.rows[0].count) === 0) {
            console.log('Generating initial meters...');
            const manufacturers = ['L&T', 'Secure Meters', 'Genus', 'HPL'];
            const categories = ['Residential', 'Commercial', 'Industrial'];
            const currentRatings = ['5-30A', '10-60A', '20-100A'];
            
            // Generate 10 meters
            for (let i = 0; i < 10; i++) {
                const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
                const category = categories[Math.floor(Math.random() * categories.length)];
                const currentRating = currentRatings[Math.floor(Math.random() * currentRatings.length)];
                const serialNumber = `SN${String(i + 1).padStart(8, '0')}`;
                const deviceId = `DID${String(i + 1).padStart(8, '0')}`;
                
                await pool.query(
                    `INSERT INTO meters (
                        meter_serial_number, device_id, manufacturer_name,
                        firmware_version, meter_type, meter_category,
                        current_rating, year_of_manufacture, ctr, ptr
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        serialNumber,
                        deviceId,
                        manufacturer,
                        '1.0.0',
                        1, // meter_type (1 for smart meter)
                        category,
                        currentRating,
                        2024,
                        1, // CTR
                        1  // PTR
                    ]
                );
                console.log(`Created meter ${serialNumber}`);
            }
        }

        // Start generating readings
        console.log('Starting to generate readings...');
        
        setInterval(async () => {
            const meters = await pool.query('SELECT id FROM meters');
            const timestamp = new Date();
            
            for (const meter of meters.rows) {
                try {
                    // Generate instantaneous profile data
                    const instantaneousData = {
                        l1_current_ir: 1 + Math.random() * 4,      // 1-5A
                        l2_current_iy: 1 + Math.random() * 4,      // 1-5A
                        l3_current_ib: 1 + Math.random() * 4,      // 1-5A
                        l1_voltage_vrn: 220 + Math.random() * 20,  // 220-240V
                        l2_voltage_vyn: 220 + Math.random() * 20,  // 220-240V
                        l3_voltage_vbn: 220 + Math.random() * 20,  // 220-240V
                        l1_power_factor: 0.8 + Math.random() * 0.2,// 0.8-1.0
                        l2_power_factor: 0.8 + Math.random() * 0.2,
                        l3_power_factor: 0.8 + Math.random() * 0.2,
                        frequency: 49.8 + Math.random() * 0.4,     // 49.8-50.2Hz
                        active_power: 1000 + Math.random() * 4000, // 1-5kW
                        reactive_power: 100 + Math.random() * 400, // 100-500VAR
                        apparent_power: 1100 + Math.random() * 4400,// 1.1-5.5kVA
                        cum_energy_wh_import: Math.random() * 1000,
                        cum_energy_wh_export: Math.random() * 100
                    };

                    // Insert instantaneous profile
                    await pool.query(
                        `INSERT INTO instantaneous_profiles (
                            meter_id, capture_time, l1_current_ir, l2_current_iy, l3_current_ib,
                            l1_voltage_vrn, l2_voltage_vyn, l3_voltage_vbn,
                            l1_power_factor, l2_power_factor, l3_power_factor,
                            frequency, active_power, reactive_power, apparent_power,
                            cum_energy_wh_import, cum_energy_wh_export
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                        [
                            meter.id, timestamp,
                            instantaneousData.l1_current_ir, instantaneousData.l2_current_iy, instantaneousData.l3_current_ib,
                            instantaneousData.l1_voltage_vrn, instantaneousData.l2_voltage_vyn, instantaneousData.l3_voltage_vbn,
                            instantaneousData.l1_power_factor, instantaneousData.l2_power_factor, instantaneousData.l3_power_factor,
                            instantaneousData.frequency, instantaneousData.active_power, instantaneousData.reactive_power,
                            instantaneousData.apparent_power, instantaneousData.cum_energy_wh_import, instantaneousData.cum_energy_wh_export
                        ]
                    );

                    // Generate block load profile data every 15 minutes
                    if (timestamp.getMinutes() % 15 === 0) {
                        const blockData = {
                            current_ir: instantaneousData.l1_current_ir,
                            current_iy: instantaneousData.l2_current_iy,
                            current_ib: instantaneousData.l3_current_ib,
                            voltage_vrn: instantaneousData.l1_voltage_vrn,
                            voltage_vyn: instantaneousData.l2_voltage_vyn,
                            voltage_vbn: instantaneousData.l3_voltage_vbn,
                            block_energy_wh_import: Math.random() * 250, // 15-min energy
                            block_energy_wh_export: Math.random() * 25,
                            signal_strength: Math.floor(Math.random() * 31) // 0-31 for RSSI
                        };

                        await pool.query(
                            `INSERT INTO block_load_profiles (
                                meter_id, capture_time, current_ir, current_iy, current_ib,
                                voltage_vrn, voltage_vyn, voltage_vbn,
                                block_energy_wh_import, block_energy_wh_export, signal_strength
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                            [
                                meter.id, timestamp,
                                blockData.current_ir, blockData.current_iy, blockData.current_ib,
                                blockData.voltage_vrn, blockData.voltage_vyn, blockData.voltage_vbn,
                                blockData.block_energy_wh_import, blockData.block_energy_wh_export,
                                blockData.signal_strength
                            ]
                        );
                    }

                    // Randomly generate events (1% chance per meter per interval)
                    if (Math.random() < 0.01) {
                        const eventTypes = ['VOLTAGE_RELATED', 'CURRENT_RELATED', 'POWER_RELATED', 'TRANSACTION'];
                        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                        const eventCode = Math.floor(Math.random() * 100) + 1;

                        await pool.query(
                            `INSERT INTO events (
                                meter_id, event_type_id, event_datetime, event_code,
                                current_ir, voltage_vrn, power_factor
                            ) VALUES ($1, 1, $2, $3, $4, $5, $6)`,
                            [
                                meter.id, timestamp, eventCode,
                                instantaneousData.l1_current_ir,
                                instantaneousData.l1_voltage_vrn,
                                instantaneousData.l1_power_factor
                            ]
                        );
                    }

                } catch (error) {
                    console.error(`Error generating data for meter ${meter.id}:`, error);
                }
            }
            
            console.log(`Generated readings at ${timestamp.toISOString()}`);
        }, 5000); // Generate readings every 5 seconds

        console.log('Simulator running. Press Ctrl+C to stop.');
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

startSimulator(); 