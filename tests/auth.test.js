const request = require('supertest');
const app = require('../src/app');

describe('Auth Service', () => {
  test('GET /auth/google should redirect to Google OAuth', async () => {
    const response = await request(app).get('/auth/google');
    expect(response.status).toBe(302); // Redirect status
    expect(response.header.location).toContain('accounts.google.com');
  });

  test('GET /auth/me should return 401 when not authenticated', async () => {
    const response = await request(app).get('/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Not authenticated');
  });
}); 