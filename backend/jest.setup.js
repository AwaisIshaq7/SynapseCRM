const mongoose = require('mongoose');
require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';

// MongoDB connection options (same as in server.js for Railway)
const connectionOptions = {
  authSource: 'admin',
  retryWrites: false,
  directConnection: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Global setup - connect to MongoDB before any tests run
beforeAll(async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      console.log('MongoDB connected for tests');
    }
  } catch (error) {
    console.error('MongoDB connection error in setup:', error.message);
    throw error;
  }
});

// Global cleanup - close connection after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
});

// Increase Jest timeout for long operations
jest.setTimeout(30000);
