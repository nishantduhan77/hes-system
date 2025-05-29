import { Pool } from 'pg';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });
  }

  async getEvents(startTime?: Date, endTime?: Date, severity?: string) {
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
      params.push(severity);
    }

    query += ' ORDER BY time DESC;';

    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }
} 