const logger = require('../config/logger');

/**
 * Global error handler utility
 * This provides a centralized way to log errors throughout the application
 */
class ErrorHandler {
  /**
   * Log an error with additional context
   * @param {Error} err - The error object
   * @param {Object} context - Additional context information
   * @returns {string} - Path to the error log file
   */
  static logError(err, context = {}) {
    return logger.logError(err, context);
  }

  /**
   * Handle API errors with proper logging and response
   * @param {Error} err - The error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} additionalInfo - Any additional context to log
   */
  static handleApiError(err, req, res, additionalInfo = {}) {
    // Log the error with request details
    const logFile = this.logError(err, {
      ...additionalInfo,
      requestId: req.id || 'unknown',
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      ip: req.ip,
      user: req.user ? req.user.id : 'unauthenticated'
    });

    // Determine appropriate status code
    const statusCode = err.statusCode || 500;
    
    // Send appropriate response
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? 'Internal server error' : err.message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId: req.id
    });
    
    return logFile;
  }

  /**
   * Create a standardized API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @returns {Error} - Formatted error
   */
  static createApiError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }
}

module.exports = ErrorHandler; 