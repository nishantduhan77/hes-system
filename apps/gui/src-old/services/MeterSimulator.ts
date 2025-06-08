import { MeterReading, DataGenerationRate } from '../types/meter';
import { SimulatorConfig } from '../config/data-injection.config';

export class MeterSimulator {
    private config: SimulatorConfig;
    private meterIds: string[];
    private isRunning: boolean = false;

    constructor(config: SimulatorConfig) {
        this.config = config;
        this.meterIds = this.generateMeterIds();
    }

    private generateMeterIds(): string[] {
        return Array.from({ length: this.config.meterCount }, (_, i) => 
            `METER_${String(i + 1).padStart(5, '0')}`
        );
    }

    public async getReadings(): Promise<MeterReading[]> {
        return Promise.all(this.meterIds.map(id => this.generateReading(id)));
    }

    private async generateReading(meterId: string): Promise<MeterReading> {
        // Add random variations to make data more realistic
        const variation = () => 1 + (Math.random() - 0.5) * 0.1; // ±5% variation

        const reading: MeterReading = {
            meterId,
            timestamp: new Date(),
            readings: {
                voltage: 230 * variation(), // Nominal voltage with variation
                current: 5 + Math.random() * 15, // Random current between 5-20A
                power: 0, // Will be calculated
                frequency: 50 * variation(), // Nominal frequency with variation
                energyConsumption: Math.random() * 100 // Random consumption
            },
            status: {
                connectionStatus: Math.random() < 0.99 ? 'CONNECTED' : 'DISCONNECTED', // 1% chance of disconnection
                quality: this.determineQuality()
            }
        };

        // Calculate power based on voltage and current
        reading.readings.power = reading.readings.voltage * reading.readings.current;

        return reading;
    }

    private determineQuality(): 'GOOD' | 'QUESTIONABLE' | 'BAD' {
        const rand = Math.random();
        if (rand < 0.95) return 'GOOD';
        if (rand < 0.98) return 'QUESTIONABLE';
        return 'BAD';
    }

    public async startSimulation(callback: (readings: MeterReading[]) => Promise<void>): Promise<void> {
        this.isRunning = true;
        
        while (this.isRunning) {
            try {
                const readings = await this.getReadings();
                await callback(readings);

                // Adjust delay based on simulation speed and generation rate
                const baseDelay = this.config.dataGenerationRate === 'FAST' ? 100 : 1000;
                const delay = baseDelay / this.config.simulationSpeed;
                
                await new Promise(resolve => setTimeout(resolve, delay));
            } catch (error) {
                console.error('Error in simulation loop:', error);
                // Continue simulation even if there's an error
            }
        }
    }

    public stopSimulation(): void {
        this.isRunning = false;
    }

    public async generateHistoricalData(startDate: Date, endDate: Date): Promise<MeterReading[]> {
        if (this.config.dataGenerationRate !== 'HISTORICAL') {
            throw new Error('Simulator not configured for historical data generation');
        }

        const readings: MeterReading[] = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            for (const meterId of this.meterIds) {
                const reading = await this.generateReading(meterId);
                reading.timestamp = new Date(currentDate);
                readings.push(reading);
            }
            currentDate.setMinutes(currentDate.getMinutes() + 15); // 15-minute intervals
        }

        return readings;
    }

    public updateConfig(config: Partial<SimulatorConfig>): void {
        this.config = { ...this.config, ...config };
        if (config.meterCount) {
            this.meterIds = this.generateMeterIds();
        }
    }

    public getSimulatorStatus(): {
        isRunning: boolean;
        meterCount: number;
        simulationSpeed: number;
        generationRate: DataGenerationRate;
    } {
        return {
            isRunning: this.isRunning,
            meterCount: this.config.meterCount,
            simulationSpeed: this.config.simulationSpeed,
            generationRate: this.config.dataGenerationRate
        };
    }
} 