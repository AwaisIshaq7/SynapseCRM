const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const app = require('./app');
const { startChurnRefresh } = require('./utils/churnRefresh');
const { generateDailyRiskReport } = require('./services/ragBatchService');
const { isMailConfigured } = require('./services/emailService');

dotenv.config();

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
    startChurnRefresh();

    if (process.env.NODE_ENV === 'production' && !isMailConfigured()) {
      console.warn('⚠️ Password reset and alert email delivery is not configured. Set SMTP_USER and SMTP_PASS for Gmail SMTP in production use.');
    }

    cron.schedule('0 8 * * *', async () => {
      try {
        console.log('📊 Running daily RAG risk report...');
        const insights = await generateDailyRiskReport();
        console.log(`✅ Generated insights for ${insights.length} at-risk customers`);
      } catch (error) {
        console.error('❌ Daily RAG risk report failed:', error.message);
      }
    });

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