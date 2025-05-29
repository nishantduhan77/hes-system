const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'hes_db',
  user: 'hes_user',
  password: 'hes_password'
});

async function checkConnection() {
  try {
    await client.connect();
    console.log('Successfully connected to TimescaleDB');
    
    const result = await client.query('SELECT version();');
    console.log('Database version:', result.rows[0].version);
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nAvailable tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

  } catch (err) {
    console.error('Error connecting to the database:', err.message);
  } finally {
    await client.end();
  }
}

checkConnection(); 