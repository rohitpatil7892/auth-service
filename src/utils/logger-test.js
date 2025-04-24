const logger = require('../config/logger');

// Example usage of different log levels
logger.info('This is an info message');
logger.error('This is an error message', new Error('Test error'));
logger.warn('This is a warning message');
logger.debug('This is a debug message');

// Example with metadata
logger.info('User action', {
  userId: '123',
  action: 'login',
  timestamp: new Date()
});

// Example with error stack trace using standard logger
try {
  throw new Error('Test error with stack trace');
} catch (error) {
  logger.error('Error occurred', { error: error.message, stack: error.stack });
}

// Test the new custom error logging function
try {
  // Simulate an application error
  throw new Error('Critical application error');
} catch (err) {
  // Use the custom logError function to log to date-based file
  const logFile = logger.logError(err, {
    userId: 'user-456',
    component: 'AuthController',
    action: 'login',
    additionalInfo: 'Failed login attempt'
  });
  
  console.log(`Error logged to file: ${logFile}`);
} 