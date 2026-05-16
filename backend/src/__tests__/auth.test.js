const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// MongoDB connection is handled by jest.setup.js

// Clean up before tests run
beforeAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: /testuser/ });
    }
  } catch (error) {
    console.error('beforeAll cleanup error:', error.message);
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: /testuser/ });
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
});

describe('Auth Routes', () => {

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'testuser1@example.com',
          password: 'TestPass123',
          role: 'sales_manager',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.role).toBe('sales_manager');
    });

    it('should fail if email already registered', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'testuser1@example.com',
          password: 'TestPass123',
          role: 'sales_manager',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'testuser2@example.com' });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'TestPass123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'WrongPassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'TestPass123',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'TestPass123',
        });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('testuser1@example.com');
    });

    it('should fail without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password and reset-password', () => {
    it('should generate a reset token and allow password reset', async () => {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'testuser1@example.com' });

      expect(forgotRes.statusCode).toBe(200);
      expect(forgotRes.body.success).toBe(true);
      expect(forgotRes.body.data).toHaveProperty('resetToken');
      expect(forgotRes.body.data).toHaveProperty('resetLink');
      expect(forgotRes.body.data.mailMode).toBeDefined();

      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${forgotRes.body.data.resetToken}`)
        .send({
          password: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        });

      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser1@example.com',
          password: 'NewPass123!',
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data).toHaveProperty('token');
    });
  });

});