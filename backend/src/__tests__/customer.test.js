const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');

let token;
let customerId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Register and login test user
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: 'TestPass123',
      role: 'admin',
    });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'testadmin@example.com',
      password: 'TestPass123',
    });

  token = loginRes.body.data.token;
});

afterAll(async () => {
  await Customer.deleteMany({ email: /testcustomer/ });
  await User.deleteMany({ email: /testadmin/ });
  await mongoose.connection.close();
});

describe('Customer Routes', () => {

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Customer',
          email: 'testcustomer1@example.com',
          phone: '0300-1234567',
          company: 'Test Corp',
          status: 'active',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Customer');
      customerId = res.body.data._id;
    });

    it('should fail without auth token', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send({ name: 'No Auth', email: 'noauth@example.com' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/customers', () => {
    it('should return list of customers', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/customers?status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(c => c.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return a single customer', async () => {
      const res = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(customerId);
    });

    it('should return 404 for invalid id', async () => {
      const res = await request(app)
        .get('/api/customers/000000000000000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update a customer', async () => {
      const res = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'at_risk' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('at_risk');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete a customer when admin', async () => {
      const res = await request(app)
        .delete(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

});