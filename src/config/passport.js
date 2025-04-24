const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');
const logger = require('./logger');

passport.serializeUser((user, done) => {
  logger.debug('Serializing user', { userId: user.id });
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    logger.debug('Deserializing user', { userId: id });
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows[0]) {
      logger.debug('User found', { userId: id });
      done(null, result.rows[0]);
    } else {
      logger.warn('User not found during deserialization', { userId: id });
      done(null, null);
    }
  } catch (error) {
    logger.error('Error deserializing user', { userId: id, error: error.message, stack: error.stack });
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      logger.info('Google authentication attempt', { 
        googleId: profile.id, 
        email: profile.emails?.[0]?.value
      });
      
      // Check if user already exists
      const result = await db.query(
        'SELECT * FROM users WHERE google_id = $1',
        [profile.id]
      );

      if (result.rows.length) {
        logger.info('Existing user logged in via Google', { 
          userId: result.rows[0].id,
          googleId: profile.id 
        });
        return done(null, result.rows[0]);
      }

      // Create new user
      logger.info('Creating new user from Google profile', { 
        googleId: profile.id,
        email: profile.emails?.[0]?.value 
      });
      
      const newUser = await db.query(
        'INSERT INTO users (google_id, email, name, picture) VALUES ($1, $2, $3, $4) RETURNING *',
        [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0].value]
      );

      logger.info('New user created', { userId: newUser.rows[0].id });
      return done(null, newUser.rows[0]);
    } catch (error) {
      logger.error('Error authenticating with Google', { 
        googleId: profile.id,
        error: error.message,
        stack: error.stack 
      });
      return done(error, null);
    }
  }
));

module.exports = passport; 