import { Pool } from 'pg';

class MeterSimulationTester {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'hes_system',
            password: process.env.DB_PASSWORD || 'admin',
            port: parseInt(process.env.DB_PORT || '5432'),
        });
    }

    async testMeterSimulation() {
        try {
            console.log('Starting meter simulation test...\n');

            // Step 1: Check registered meters
            const meters = await this.checkRegisteredMeters();
            if (meters.length === 0) {
                throw new Error('No meters found in the database');
            }
            console.log(`Found ${meters.length} registered meters\n`);

            // Step 2: Check meter status
            await this.checkMeterStatus(meters);

            // Step 3: Check recent readings
            await this.checkRecentReadings(meters);

            // Step 4: Validate data quality
            await this.validateDataQuality(meters);

            console.log('\nMeter simulation test completed successfully!');
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        } finally {
            await this.pool.end();
        }
    }

    private async checkRegisteredMeters(): Promise<any[]> {
        const result = await this.pool.query(`
            SELECT meter_id, serial_number, manufacturer, model, status, last_communication
            FROM meters
        `);
        
        console.log('Registered Meters:');
        result.rows.forEach(meter => {
            console.log(`- ${meter.serial_number} (${meter.manufacturer} ${meter.model})`);
            console.log(`  Status: ${meter.status}, Last Communication: ${meter.last_communication}`);
        });
        
        return result.rows;
    }

    private async checkMeterStatus(meters: any[]) {
        console.log('\nChecking meter status...');
        
        const activeMeters = meters.filter(m => m.status === 'CONNECTED');
        console.log(`- Active meters: ${activeMeters.length}/${meters.length}`);
        
        const recentlyActive = meters.filter(m => {
            const lastComm = new Date(m.last_communication);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return lastComm > fiveMinutesAgo;
        });
        
        console.log(`- Recently active meters (last 5 minutes): ${recentlyActive.length}/${meters.length}`);
        
        if (recentlyActive.length === 0) {
            throw new Error('No meters have been active in the last 5 minutes');
        }
    }

    private async checkRecentReadings(meters: any[]) {
        console.log('\nChecking recent readings...');
        
        for (const meter of meters) {
            const result = await this.pool.query(`
                SELECT 
                    COUNT(*) as reading_count,
                    MAX(timestamp) as last_reading,
                    AVG(active_power_import) as avg_power,
                    AVG(voltage_r_phase) as avg_voltage
                FROM power_readings
                WHERE meter_id = $1
                AND timestamp > NOW() - INTERVAL '5 minutes'
            `, [meter.meter_id]);
            
            const stats = result.rows[0];
            console.log(`\nMeter ${meter.serial_number}:`);
            console.log(`- Readings in last 5 minutes: ${stats.reading_count}`);
            if (stats.last_reading) {
                console.log(`- Last reading: ${stats.last_reading}`);
                console.log(`- Average power: ${Number(stats.avg_power).toFixed(2)} W`);
                console.log(`- Average voltage: ${Number(stats.avg_voltage).toFixed(2)} V`);
            }
            
            if (stats.reading_count === '0') {
                throw new Error(`No recent readings for meter ${meter.serial_number}`);
            }
        }
    }

    private async validateDataQuality(meters: any[]) {
        console.log('\nValidating data quality...');
        
        for (const meter of meters) {
            const result = await this.pool.query(`
                SELECT 
                    COUNT(*) as total_readings,
                    COUNT(*) FILTER (WHERE quality_code != 0) as error_readings,
                    COUNT(*) FILTER (WHERE voltage_r_phase < 180 OR voltage_r_phase > 260) as voltage_violations,
                    AVG(active_power_import) as avg_power,
                    STDDEV(active_power_import) as power_stddev
                FROM power_readings
                WHERE meter_id = $1
                AND timestamp > NOW() - INTERVAL '5 minutes'
            `, [meter.meter_id]);
            
            const stats = result.rows[0];
            console.log(`\nMeter ${meter.serial_number} data quality:`);
            console.log(`- Total readings: ${stats.total_readings}`);
            console.log(`- Error readings: ${stats.error_readings}`);
            console.log(`- Voltage violations: ${stats.voltage_violations}`);
            console.log(`- Power variation coefficient: ${
                stats.avg_power > 0 ? 
                (Number(stats.power_stddev) / Number(stats.avg_power) * 100).toFixed(2) + '%' : 
                'N/A'
            }`);
            
            // Validate data quality
            if (Number(stats.error_readings) / Number(stats.total_readings) > 0.1) {
                throw new Error(`High error rate for meter ${meter.serial_number}`);
            }
            
            if (Number(stats.voltage_violations) / Number(stats.total_readings) > 0.1) {
                throw new Error(`High voltage violation rate for meter ${meter.serial_number}`);
            }
        }
    }
}

// Run the test
const tester = new MeterSimulationTester();
tester.testMeterSimulation()
    .then(() => console.log('Test completed successfully'))
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    }); 