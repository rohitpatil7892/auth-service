const app = require('./app');
const config = require('./config');
const initializeDatabase = require('./config/init-db');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3001;

// Initialize database schema
initializeDatabase()
  .then(() => {
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Auth service is running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Failed to initialize database', { error: err.message, stack: err.stack });
    process.exit(1);
  }); 