const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const app = require('./app');
const { startChurnRefresh } = require('./utils/churnRefresh');
const { generateDailyRiskReport } = require('./services/ragBatchService');
const { isMailConfigured } = require('./services/emailService');
const { seedDemoUser } = require('./utils/seedDemoUser');
const { syncInboxToDatabase, isImapConfigured } = require('./services/emailSyncService');

dotenv.config();

// DB Connection — Atlas (srv or replica set) vs Railway single-host proxy
const mongoUri = process.env.MONGO_URI || '';
const isAtlas =
  mongoUri.startsWith('mongodb+srv') ||
  mongoUri.includes('replicaSet=') ||
  mongoUri.includes('.mongodb.net');
const connectionOptions = isAtlas
  ? {
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }
  : {
      authSource: 'admin',
      retryWrites: false,
      directConnection: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

mongoose.connect(process.env.MONGO_URI, connectionOptions)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedDemoUser();
    startChurnRefresh();

    const runEmailSync = () => {
      if (!isImapConfigured()) return;
      syncInboxToDatabase({
        limit: Number(process.env.EMAIL_SYNC_LIMIT) || 200,
        sinceDays: Number(process.env.EMAIL_SYNC_SINCE_DAYS) || 180,
      })
        .then((stats) => {
          if (stats.interactionsCreated > 0) {
            console.log(`📬 Email sync: +${stats.interactionsCreated} new, ${stats.customersCreated} customer(s)`);
          }
        })
        .catch((err) => console.warn('⚠️ Email sync:', err.message));
    };

    if (process.env.SYNC_EMAILS_ON_START === 'true') runEmailSync();

    const autoMins = Number(process.env.EMAIL_AUTO_SYNC_MINUTES) || 0;
    if (autoMins > 0) {
      runEmailSync();
      setInterval(runEmailSync, autoMins * 60 * 1000);
      console.log(`📬 Auto email sync every ${autoMins} minute(s)`);
    }

    if (process.env.NODE_ENV === 'production' && !isMailConfigured()) {
      console.warn('⚠️ Password reset and alert email delivery is not configured. Set SMTP_USER and SMTP_PASS for Gmail SMTP in production use.');
    }

    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production' && !process.env.FRONTEND_URL) {
      console.warn('⚠️ FRONTEND_URL is not set. Password reset links will fall back to the request origin in non-production environments.');
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