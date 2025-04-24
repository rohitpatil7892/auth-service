const fs = require('fs');
const path = require('path');
const db = require('./database');
const logger = require('./logger');

const initializeDatabase = async () => {
  // Skip database initialization during tests
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping database initialization in test environment');
    return;
  }
  
  logger.info('Starting database schema initialization');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await db.query(schema);
    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Error initializing database', {
      error: error.message, 
      stack: error.stack
    });
    
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = initializeDatabase; 