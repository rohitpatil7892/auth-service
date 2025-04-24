const { Pool } = require('pg');
const config = require('./index');
const logger = require('./logger');

// Determine if we're running in Docker or locally
const isDocker = process.env.DOCKER_ENV === 'true';

const pool = new Pool({
  connectionString: isDocker 
    ? config.database.url 
    : 'postgresql://testUser:12345@localhost:5442/auth_service',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error connecting to the database', { error: err.stack });
  } else {
    logger.info('Successfully connected to the database');
    release();
  }
});

// Log queries in development environment
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Executed query', { 
        query: text, 
        duration: `${duration}ms`, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (err) {
    logger.error('Database query error', { 
      query: text, 
      params, 
      error: err.message,
      stack: err.stack
    });
    throw err;
  }
};

module.exports = {
  query,
  pool
}; 