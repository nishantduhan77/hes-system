import { Pool, QueryResult, PoolConfig } from 'pg';

interface MeterEvent {
  time: Date;
  meter_id: string;
  event_type: string;
  event_description: string;
  severity: number;
}

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;

  private constructor() {
    const config: PoolConfig = {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };
    this.pool = new Pool(config);

    // Setup error handling for the pool
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Meter Operations
  public async addMeter(meterId: string, location: string, meterType: string, firmwareVersion: string): Promise<void> {
    const query = `
      INSERT INTO meters (meter_id, location, meter_type, firmware_version)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (meter_id) DO UPDATE
      SET location = $2, meter_type = $3, firmware_version = $4;
    `;
    await this.pool.query(query, [meterId, location, meterType, firmwareVersion]);
  }

  public async getMeterInfo(meterId: string): Promise<any> {
    const query = 'SELECT * FROM meters WHERE meter_id = $1;';
    const result = await this.pool.query(query, [meterId]);
    return result.rows[0];
  }

  // Meter Readings Operations
  public async addMeterReading(
    meterId: string,
    timestamp: Date,
    obisCode: string,
    value: number,
    unit: string,
    qualityCode: number
  ): Promise<void> {
    const query = `
      INSERT INTO meter_readings (time, meter_id, obis_code, value, unit, quality_code)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    await this.pool.query(query, [timestamp, meterId, obisCode, value, unit, qualityCode]);
  }

  public async getMeterReadings(
    meterId: string,
    startTime: Date,
    endTime: Date,
    obisCode?: string
  ): Promise<any[]> {
    let query = `
      SELECT time, obis_code, value, unit, quality_code
      FROM meter_readings
      WHERE meter_id = $1 AND time BETWEEN $2 AND $3
    `;
    const params = [meterId, startTime, endTime];

    if (obisCode) {
      query += ' AND obis_code = $4';
      params.push(obisCode);
    }

    query += ' ORDER BY time DESC;';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // Events Operations
  public async addEvent(
    meterId: string,
    timestamp: Date,
    eventType: string,
    description: string,
    severity: number
  ): Promise<void> {
    const query = `
      INSERT INTO meter_events (time, meter_id, event_type, event_description, severity)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await this.pool.query(query, [timestamp, meterId, eventType, description, severity]);
  }

  public async getEvents(
    startTime?: Date,
    endTime?: Date,
    severity?: string | number
  ): Promise<MeterEvent[]> {
    let query = 'SELECT * FROM meter_events WHERE true';
    const params: (string | Date)[] = [];
    let paramCount = 0;

    if (startTime) {
      paramCount++;
      query += ` AND time >= $${paramCount}`;
      params.push(startTime);
    }

    if (endTime) {
      paramCount++;
      query += ` AND time <= $${paramCount}`;
      params.push(endTime);
    }

    if (severity !== undefined) {
      paramCount++;
      query += ` AND severity = $${paramCount}`;
      params.push(severity.toString());
    }

    query += ' ORDER BY time DESC;';

    try {
      const result: QueryResult<MeterEvent> = await this.pool.query(query, params);
      return result.rows;
    } catch (error: unknown) {
      const dbError = error as DatabaseError;
      console.error('Error fetching events:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail
      });
      throw dbError;
    }
  }

  // Daily Statistics
  public async getDailyStats(
    meterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const query = `
      SELECT bucket, obis_code, avg_value, max_value, min_value
      FROM daily_energy_stats
      WHERE meter_id = $1 AND bucket BETWEEN $2 AND $3
      ORDER BY bucket DESC;
    `;
    const result = await this.pool.query(query, [meterId, startDate, endDate]);
    return result.rows;
  }

  // Helper method for custom queries
  public async query(text: string, params: any[]): Promise<QueryResult> {
    return this.pool.query(text, params);
  }

  // Cleanup
  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export default DatabaseService; 