const express = require('express');
const passport = require('passport');
const SessionService = require('../services/session.service');
const RBACService = require('../services/rbac.service');
const authMiddleware = require('../middleware/auth.middleware');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const logger = require('../config/logger');
const ErrorHandler = require('../utils/error-handler');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      logger.info('Google authentication callback received', { 
        userId: req.user.id, 
        email: req.user.email 
      });
      
      // Create a new session for the user
      const session = await SessionService.createSession(req.user.id);
      logger.info('Session created successfully after Google auth', { 
        userId: req.user.id, 
        sessionId: session.id 
      });
      
      // Register user in RBAC service
      try {
        await RBACService.registerUser(req.user);
        logger.info('User registered in RBAC service', { userId: req.user.id });
      } catch (rbacError) {
        logger.error('Failed to register user in RBAC service', { 
          userId: req.user.id, 
          error: rbacError.message 
        });
        // Continue with the flow even if RBAC registration fails
      }
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}?token=${session.token}`);
    } catch (error) {
      logger.error('Error in Google callback', { 
        userId: req.user?.id, 
        error: error.message, 
        stack: error.stack 
      });
      res.redirect(`${process.env.FRONTEND_URL}/login?error=session_creation_failed`);
    }
  }
);

// Helper function to verify Google token
async function verifyGoogleToken(token) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
  } catch (error) {
    logger.error('Google token verification failed', { error: error.message });
    throw new Error('Invalid Google token');
  }
}

// Google token authentication
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    logger.info('Google token authentication attempt');
    
    // Verify the Google token
    const payload = await verifyGoogleToken(token);
    logger.info('Google token verified', { email: payload.email });
    
    // Find user
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [payload.email]
    );
    
    let user;
    if (existingUser.rows.length === 0) {
      logger.info('Creating new user from Google authentication', { 
        email: payload.email, 
        googleId: payload.sub 
      });
      
      // Create new user
      const result = await db.query(
        'INSERT INTO users (email, name, picture, google_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [payload.email, payload.name, payload.picture, payload.sub]
      );
      user = result.rows[0];
      
      // Register user in RBAC service
      try {
        await RBACService.registerUser(user);
        logger.info('User registered in RBAC service', { userId: user.id });
      } catch (rbacError) {
        logger.error('Failed to register user in RBAC service', { 
          userId: user.id, 
          error: rbacError.message 
        });
        // Continue with the flow even if RBAC registration fails
      }
    } else {
      user = existingUser.rows[0];
      // Update user information
      logger.info('Updating existing user from Google authentication', { 
        userId: user.id, 
        email: user.email 
      });
      
      const result = await db.query(
        'UPDATE users SET name = $1, picture = $2, google_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [payload.name, payload.picture, payload.sub, user.id]
      );
      user = result.rows[0];
    }
    
    // Create session using SessionService
    const session = await SessionService.createSession(user.id);
    logger.info('Session created successfully', { 
      userId: user.id, 
      sessionId: session.id 
    });
    
    res.json({
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    logger.error('Google auth error', { error: error.message });
    return ErrorHandler.handleApiError(error, req, res);
  }
});

// Create session from token
router.post('/session', async (req, res) => {
  try {
    logger.debug('Session creation attempt');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Session creation failed - no token provided', { 
        ip: req.ip 
      });
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    logger.debug('Verifying token for session creation');
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info('Token verified successfully', { 
      userId: decoded.id || decoded.userId 
    });
    
    // Create a new session
    const userId = decoded.id || decoded.userId;
    const session = await SessionService.createSession(userId);
    logger.info('Session created successfully', { 
      userId: userId, 
      sessionId: session.id
    });
    
    res.json({
      message: 'Session created successfully',
      token: session.token
    });
  } catch (error) {
    logger.error('Error creating session', { 
      error: error.message, 
      stack: error.stack,
      headers: req.headers.authorization ? 'Token provided' : 'No token'
    });
    return ErrorHandler.handleApiError(error, req, res);
  }
});

// Logout route
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    logger.info('Logout attempt', { userId: req.user.id });
    const token = req.headers.authorization.split(' ')[1];
    await SessionService.deleteSession(token);
    logger.info('User logged out successfully', { userId: req.user.id });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Error during logout', { 
      userId: req.user?.id, 
      error: error.message, 
      stack: error.stack 
    });
    return ErrorHandler.handleApiError(error, req, res);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    logger.debug('Fetching current user data', { userId: req.user.id });
    const result = await db.query('SELECT id, email, name, picture FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      logger.warn('User not found during profile fetch', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }
    logger.debug('User data fetched successfully', { userId: req.user.id });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching user data', { 
      userId: req.user?.id, 
      error: error.message, 
      stack: error.stack 
    });
    return ErrorHandler.handleApiError(error, req, res);
  }
});

module.exports = router; 