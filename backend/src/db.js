const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function checkDatabaseConnection() {
  const result = await pool.query('SELECT NOW() AS current_time');
  return result.rows[0];
}

module.exports = {
  pool,
  query,
  checkDatabaseConnection,
};
