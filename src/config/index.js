require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://testUser:12345@postgres:5432/student_management'
  },
  redis: {
    host: process.env.REDIS_HOST || 'in-redis',
    port: process.env.REDIS_PORT || 6379
  }
}; 