const axios = require('axios');
const logger = require('../config/logger');

class RBACService {
  constructor() {
    this.baseURL = process.env.RBAC_SERVICE_URL || 'http://localhost:3002/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Register a user in the RBAC service
   * @param {Object} userData - User data to register
   * @returns {Promise} - Promise resolving to the registered user
   */
  async registerUser(userData) {
    try {
      logger.info('Registering user in RBAC service', { 
        userId: userData.id, 
        email: userData.email 
      });
      
      const response = await this.client.post('/users/register', {
        user_id: userData.id,
        email: userData.email,
        name: userData.name,
        is_superuser: userData.is_superuser || false
      });
      
      logger.info('User registered successfully in RBAC service', { 
        userId: userData.id 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error registering user in RBAC service', { 
        userId: userData.id, 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
}

module.exports = new RBACService(); 