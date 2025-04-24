const app = require('./app');
require('dotenv').config();
const logger = require('./config/logger');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const POSTGRES_URI = process.env.POSTGRES_URI || 'postgres://postgres:postgres@localhost:5432/auth_service';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: POSTGRES_URI,
});

// Test the database connection
pool.connect()
  .then(() => {
    logger.info('Successfully connected to PostgreSQL');
  })
  .catch((err) => {
    logger.error('PostgreSQL connection error', { error: err.message, stack: err.stack });
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Export the pool for use in other files
module.exports = { pool }; 