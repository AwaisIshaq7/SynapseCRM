const cron = require('node-cron');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const User = require('../models/User');
const axios = require('axios');
const { sendChurnAlert } = require('../services/emailService');
const { createChurnNotification } = require('../controllers/notificationController');

const refreshAllChurnScores = async () => {
  try {
    console.log('🔄 Auto churn refresh started...');

    const customers = await Customer.find({ status: { $ne: 'inactive' } });

    for (const customer of customers) {
      const interactions = await Interaction.find({
        customerId: customer._id,
        sentimentScore: { $ne: null },
      }).sort({ date: -1 }).limit(10);

      if (interactions.length === 0) continue;

      const lastContact = customer.lastContactDate || new Date();
      const daysSinceLastContact = Math.floor(
        (new Date() - new Date(lastContact)) / (1000 * 60 * 60 * 24)
      );

      const avgSentimentScore =
        interactions.reduce((sum, i) => sum + i.sentimentScore, 0) / interactions.length;

      const interactionCount = interactions.length;

      const oldestDate = interactions[interactions.length - 1].date;
      const daySpan = Math.max(
        Math.floor((new Date() - new Date(oldestDate)) / (1000 * 60 * 60 * 24)),
        1
      );
      const interactionFrequency = interactionCount / daySpan;

      try {
        const response = await axios.post(
          `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/churn-risk`,
          {
            daysSinceLastContact,
            avgSentimentScore: parseFloat(avgSentimentScore.toFixed(4)),
            interactionCount,
            interactionFrequency: parseFloat(interactionFrequency.toFixed(4)),
          },
          { timeout: 5000 }
        );

        const { churnScore, riskLevel } = response.data;

        const newStatus =
          churnScore >= 0.7
            ? 'at_risk'
            : customer.status === 'at_risk'
            ? 'active'
            : customer.status;

        await Customer.findByIdAndUpdate(customer._id, {
          churnScore,
          status: newStatus,
        });

        if (churnScore >= 0.7 && customer.churnScore < 0.7) {
          const manager = await User.findById(customer.assignedTo).select('name email');
          if (manager) {
            await sendChurnAlert(
              manager.email,
              manager.name,
              customer.name,
              churnScore
            );
            await createChurnNotification(manager._id, customer.name, churnScore);
          }
        }

        console.log(`✅ ${customer.name}: churnScore=${churnScore}, risk=${riskLevel}`);

      } catch (flaskError) {
        console.log(`⚠️ Flask unavailable for ${customer.name} — skipping`);
      }
    }

    console.log('✅ Auto churn refresh complete');

  } catch (err) {
    console.error('❌ Churn refresh error:', err.message);
  }
};

const startChurnRefresh = () => {
  cron.schedule('0 0 * * *', refreshAllChurnScores);
  console.log('⏰ Churn refresh scheduler started (runs daily at midnight)');
};

module.exports = { startChurnRefresh, refreshAllChurnScores };
