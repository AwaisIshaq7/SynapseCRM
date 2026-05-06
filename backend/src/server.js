const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/customers/:id/interactions', require('./routes/interactionRoutes'));
app.use('/api/interactions', require('./routes/standaloneInteractionRoutes'));
// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'SynapseCRM API is running' });
});

// DB Connection
const connectionOptions = {
  // Railway MongoDB requires these specific authentication settings
  authSource: 'admin',           // Critical for Railway
  retryWrites: false,            // Railway doesn't support retryWrites
  directConnection: true,        // Use direct connection to proxy
  
  // Connection pool
  maxPoolSize: 10,
  minPoolSize: 2,
  
  // Timeouts
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGO_URI, connectionOptions)
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🖥️  Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB connection failed');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    
    if (err.message.includes('authentication failed')) {
      console.error('\n🔐 Authentication Error - Check:');
      console.error('  • Username and password in .env MONGO_URI');
      console.error('  • Railway dashboard > MongoDB > Connect');
      console.error('  • Credentials match exactly (including special chars)');
    }
    
    console.error('\nConnection string (masked):');
    console.error('  ' + process.env.MONGO_URI.replace(/:[^@]*@/, ':****@'));
    
    process.exit(1);
  });