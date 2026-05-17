const User = require('../models/User');

const DEMO_EMAIL = (process.env.DEMO_EMAIL || 'demo@synapsecrm.com').toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@1234';
const DEMO_NAME = process.env.DEMO_NAME || 'Demo User';

async function seedDemoUser() {
  try {
    const existing = await User.findOne({ email: DEMO_EMAIL });
    if (existing) {
      if (!existing.emailVerified) {
        existing.emailVerified = true;
        await existing.save();
      }
      return;
    }

    await User.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      role: 'sales_manager',
      emailVerified: true,
    });
    console.log(`✅ Demo account ready: ${DEMO_EMAIL}`);
  } catch (err) {
    console.warn('⚠️ Demo user seed skipped:', err.message);
  }
}

module.exports = { seedDemoUser, DEMO_EMAIL, DEMO_PASSWORD };
