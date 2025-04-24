const db = require('../config/database');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

class SessionService {
  static async createSession(userId) {
    try {
      logger.debug('Creating new session', { userId });
      
      // Generate a unique token with proper expiration
      const token = jwt.sign(
        { 
          id: userId,
          type: 'auth' // Add token type to distinguish from other tokens
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRATION || '1h',
          algorithm: 'HS256'
        }
      );

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

      // Insert session into database
      const result = await db.query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
        [userId, token, expiresAt]
      );

      logger.info('Session created successfully', { 
        userId, 
        sessionId: result.rows[0].id,
        expiresAt: expiresAt 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating session', { 
        userId, 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }

  static async validateSession(token) {
    try {
      logger.debug('Validating session token');
      
      // First verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Then check if the session exists and is not expired
      const result = await db.query(
        'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        logger.warn('Session not found or expired', { token });
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error validating session', { 
        error: error.message, 
        stack: error.stack 
      });
      return null;
    }
  }

  static async deleteSession(token) {
    try {
      logger.debug('Deleting session by token');
      
      // First get the session to log user ID
      const sessionQuery = await db.query('SELECT * FROM sessions WHERE token = $1', [token]);
      const userId = sessionQuery.rows.length > 0 ? sessionQuery.rows[0].user_id : 'unknown';
      
      await db.query('DELETE FROM sessions WHERE token = $1', [token]);
      
      logger.info('Session deleted successfully', { userId });
    } catch (error) {
      logger.error('Error deleting session', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }

  static async deleteUserSessions(userId) {
    try {
      logger.debug('Deleting all sessions for user', { userId });
      
      await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
      
      logger.info('All user sessions deleted successfully', { userId });
    } catch (error) {
      logger.error('Error deleting user sessions', { 
        userId,
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

module.exports = SessionService; 