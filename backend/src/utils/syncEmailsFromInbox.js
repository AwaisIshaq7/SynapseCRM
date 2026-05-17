/**
 * CLI: import real inbox emails into MongoDB
 * Usage: node src/utils/syncEmailsFromInbox.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { syncInboxToDatabase, isImapConfigured } = require('../services/emailSyncService');

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ MONGO_URI is not set in backend/.env');
  process.exit(1);
}

if (!isImapConfigured()) {
  console.error('❌ Set SMTP_USER and SMTP_PASS (Gmail app password) in backend/.env');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('✅ MongoDB connected');
    console.log('📬 Fetching emails from inbox...');

    const stats = await syncInboxToDatabase({
      limit: Number(process.env.EMAIL_SYNC_LIMIT) || 50,
      sinceDays: Number(process.env.EMAIL_SYNC_SINCE_DAYS) || 30,
    });

    console.log('✅ Email sync complete:');
    console.log(`   Fetched:              ${stats.fetched}`);
    console.log(`   Customers created:    ${stats.customersCreated}`);
    console.log(`   Interactions created: ${stats.interactionsCreated}`);
    console.log(`   Skipped (duplicate):  ${stats.skippedDuplicate}`);
    console.log(`   Skipped (other):      ${stats.skippedOther}`);

    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Email sync failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
