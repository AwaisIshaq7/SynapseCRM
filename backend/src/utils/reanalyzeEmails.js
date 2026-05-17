require('dotenv').config();
const mongoose = require('mongoose');
const { reanalyzeAllCustomers } = require('../services/emailIntelligenceService');

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    console.log('🧠 Re-analyzing email sentiment & priorities...');
    const stats = await reanalyzeAllCustomers();
    console.log('✅ Done:', stats);
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
  });
