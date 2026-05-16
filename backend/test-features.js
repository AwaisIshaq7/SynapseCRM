const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./src/app');
const User = require('./src/models/User');
const Customer = require('./src/models/Customer');
const Notification = require('./src/models/Notification');

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

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    console.log('✅ DB Connected');

    // Get or create a test user
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'admin'
      });
    }
    console.log('✅ Test user:', user._id);

    // Test 1: Search endpoint
    console.log('\n🔍 Testing Search...');
    const searchRes = await request(app)
      .get('/api/customers/search?q=test&limit=5')
      .set('Authorization', `Bearer ${generateToken(user._id)}`);
    console.log('Search Status:', searchRes.status);
    console.log('Search Response:', searchRes.body);

    // Test 2: Notifications endpoint  
    console.log('\n🔔 Testing Notifications...');
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${generateToken(user._id)}`);
    console.log('Notifications Status:', notifRes.status);
    console.log('Notifications Response:', JSON.stringify(notifRes.body).substring(0, 200));

    // Test 3: PDF export endpoint
    console.log('\n📄 Testing PDF Export...');
    const pdfRes = await request(app)
      .post('/api/reports/export/dashboard')
      .set('Authorization', `Bearer ${generateToken(user._id)}`)
      .send({ dateRange: '7d' });
    console.log('PDF Export Status:', pdfRes.status);
    console.log('PDF Export Headers:', pdfRes.headers['content-type']);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

function generateToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

test();
