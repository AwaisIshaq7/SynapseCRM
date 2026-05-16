const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const connectionOptions = {
  authSource: 'admin',
  retryWrites: false,
  directConnection: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
};

mongoose.connect(process.env.MONGO_URI, connectionOptions)
  .then(async () => {
    const User = require('./src/models/User');
    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ No users found in database');
      process.exit(1);
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ Test token created');
    console.log('Token:', token);
    console.log('User:', user._id);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
