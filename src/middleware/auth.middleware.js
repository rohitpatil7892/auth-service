const SessionService = require('../services/session.service');
const logger = require('../config/logger');
const ErrorHandler = require('../utils/error-handler');

const authMiddleware = async (req, res, next) => {
  try {
    logger.debug('Authenticating request', { 
      path: req.path, 
      method: req.method,
      ip: req.ip
    });
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed - No token provided', { 
        path: req.path, 
        ip: req.ip 
      });
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Validate session
    const session = await SessionService.validateSession(token);
    if (!session) {
      logger.warn('Authentication failed - Invalid or expired session', { 
        path: req.path, 
        ip: req.ip 
      });
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // Add user info to request
    req.user = { id: session.user_id };
    
    logger.debug('Authentication successful', { 
      userId: session.user_id, 
      path: req.path
    });
    
    next();
  } catch (error) {
    logger.error('Auth middleware error', { 
      path: req.path, 
      ip: req.ip,
      error: error.message, 
      stack: error.stack 
    });
    
    return ErrorHandler.handleApiError(error, req, res, {
      context: 'Authentication Middleware',
      path: req.path
    });
  }
};

module.exports = authMiddleware; 