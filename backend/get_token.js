const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  authSource: 'admin',
  retryWrites: false,
  directConnection: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
}).then(async () => {
  const User = require('./src/models/User');
  const user = await User.findOne();
  if (!user) process.exit(1);
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  process.stdout.write(token);
  process.exit(0);
}).catch(() => process.exit(1));
