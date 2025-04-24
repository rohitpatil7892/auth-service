const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Get current date in YYYY-MM-DD format for log filenames
const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create simple text format (date time level message)
const simpleFormat = winston.format.printf(({ level, message, timestamp, ...rest }) => {
  // Format the base log
  let log = `${timestamp} ${level.toUpperCase()} ${message}`;
  
  // Add any additional metadata (excluding timestamp, level, message, and stack)
  const metadata = { ...rest };
  delete metadata.service;
  
  if (Object.keys(metadata).length > 0) {
    // If there's an error object with a stack, handle it separately
    if (metadata.stack) {
      const stack = metadata.stack;
      delete metadata.stack;
      log += `\n${stack}`;
    }
    
    // Add remaining metadata if any
    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }
  }
  
  return log;
});

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  simpleFormat
);

// Create console format with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.colorize(),
  simpleFormat
);

// Create date-based filenames
const errorLogFile = path.join(logsDir, `error-${getCurrentDate()}.log`);
const combinedLogFile = path.join(logsDir, `combined-${getCurrentDate()}.log`);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Write all logs with level 'error' and below to error-YYYY-MM-DD.log
    new winston.transports.File({
      filename: errorLogFile,
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 30,
    }),
    // Write all logs with level 'info' and below to combined-YYYY-MM-DD.log
    new winston.transports.File({
      filename: combinedLogFile,
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 30,
    })
  ]
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => logger.info(message.trim())
};

// Custom error handling function
logger.logError = (err, additionalInfo = {}) => {
  const currentDate = getCurrentDate();
  const errorLogFile = path.join(logsDir, `error-${currentDate}.log`);
  
  // Log the error with Winston
  logger.error(err.message, {
    stack: err.stack,
    ...additionalInfo
  });

  return errorLogFile;
};

module.exports = logger; 