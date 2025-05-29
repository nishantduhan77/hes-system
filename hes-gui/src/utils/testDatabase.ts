import DatabaseService from '../services/DatabaseService';

async function testDatabaseConnection(): Promise<void> {
  const db = DatabaseService.getInstance();
  
  try {
    // Test meter operations
    await db.addMeter(
      'TEST_METER_001',
      'Test Location',
      'Smart Meter',
      '1.0.0'
    );

    const meterInfo = await db.getMeterInfo('TEST_METER_001');
    console.log('Meter Info:', meterInfo);

    // Test meter readings
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const endTime = now;

    await db.addMeterReading(
      'TEST_METER_001',
      now,
      '1.8.0',
      123.45,
      'kWh',
      1
    );

    const readings = await db.getMeterReadings(
      'TEST_METER_001',
      startTime,
      endTime,
      '1.8.0'
    );
    console.log('Meter Readings:', readings);

    // Test events
    await db.addEvent(
      'TEST_METER_001',
      now,
      'TEST_EVENT',
      'Test event description',
      1
    );

    const events = await db.getEvents(
      startTime,
      endTime,
      1
    );
    console.log('Events:', events);

    // Test daily stats
    const stats = await db.getDailyStats(
      'TEST_METER_001',
      startTime,
      endTime
    );
    console.log('Daily Stats:', stats);

    console.log('All database tests passed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

export default testDatabaseConnection; 