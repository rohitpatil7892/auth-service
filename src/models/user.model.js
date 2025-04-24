const db = require('../config/database');
const logger = require('../config/logger');

class User {
  static async create(userData) {
    try {
      const { email, name, picture, googleId } = userData;
      const now = new Date();
      
      const result = await db.query(
        'INSERT INTO users (email, name, picture, google_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [email, name, picture, googleId, now, now]
      );
      
      logger.info('New user created', { userId: result.rows[0].id, email: result.rows[0].email });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email', { email, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async findByGoogleId(googleId) {
    try {
      const result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by Google ID', { googleId, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID', { id, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async update(id, userData) {
    try {
      const { email, name, picture } = userData;
      const now = new Date();
      
      const result = await db.query(
        'UPDATE users SET email = $1, name = $2, picture = $3, updated_at = $4 WHERE id = $5 RETURNING *',
        [email, name, picture, now, id]
      );
      
      logger.info('User updated', { userId: id, email: result.rows[0].email });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user', { id, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      logger.info('User removed', { userId: id, email: result.rows[0]?.email });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting user', { id, error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = User; 