const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const fetch = require('node-fetch');

dotenv.config();

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
    const User = require('./src/models/User');
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

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Test PDF export endpoint
    console.log('\n📄 Testing PDF Export...');
    const response = await fetch('http://localhost:5000/api/reports/export/dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ dateRange: '7d' })
    });

    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Content-Disposition:', response.headers.get('content-disposition'));

    const buffer = await response.buffer();
    console.log('PDF File Size:', buffer.length, 'bytes');

    // Save PDF to test file
    fs.writeFileSync('./test-report.pdf', buffer);
    console.log('✅ PDF saved to test-report.pdf');

    // Check if PDF has content (PDFs start with %PDF)
    const isPDF = buffer.toString('utf-8', 0, 4) === '%PDF';
    console.log('✅ Valid PDF format:', isPDF);

    // Check file size to determine if it has content
    if (buffer.length > 5000) {
      console.log('✅ PDF has substantial content (>5KB)');
    } else if (buffer.length > 1000) {
      console.log('⚠️  PDF might be minimal but valid');
    } else {
      console.log('❌ PDF is too small, might be empty');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

test();
