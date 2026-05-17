const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const axios = require('axios');
const cron = require('node-cron');

/**
 * Compile customer metrics from MongoDB and post to Flask to retrain the RandomForest classifier.
 */
const retrainChurnModel = async () => {
  try {
    console.log('🔮 Starting live Churn Model Retraining compilation...');

    const customers = await Customer.find({});
    const samples = [];

    for (const customer of customers) {
      // Fetch latest 20 interactions for feature analysis
      const interactions = await Interaction.find({
        customerId: customer._id,
        sentimentScore: { $ne: null }
      }).sort({ date: -1 }).limit(20);

      // If no interactions logged, use healthy heuristic fallbacks
      const recency = customer.lastContactDate 
        ? Math.floor((new Date() - new Date(customer.lastContactDate)) / (1000 * 60 * 60 * 24))
        : 90;

      const avgSentiment = interactions.length > 0
        ? interactions.reduce((sum, i) => sum + i.sentimentScore, 0) / interactions.length
        : 0.25; // default positive-neutral sentiment fallback

      const totalCount = interactions.length || 0;

      const daySpan = interactions.length > 0
        ? Math.max(Math.floor((new Date() - new Date(interactions[interactions.length - 1].date)) / (1000 * 60 * 60 * 24)), 1)
        : 30;
      const frequency = totalCount / daySpan;

      // Labeling churn: 
      // 1 if customer status is inactive or churnScore >= 0.70 (marked high risk). Otherwise 0.
      const churnLabel = (customer.status === 'inactive' || customer.churnScore >= 0.7) ? 1 : 0;

      samples.push({
        days_since_last_contact: recency,
        avg_sentiment_score: parseFloat(avgSentiment.toFixed(4)),
        interaction_count: totalCount,
        interaction_frequency: parseFloat(frequency.toFixed(4)),
        churn: churnLabel
      });
    }

    if (samples.length < 5) {
      console.log('⚠️ Insufficient customer records to compile training sets. Cancelling retraining.');
      return { success: false, error: 'Need at least 5 customer samples to retrain model.' };
    }

    const aiUrl = `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/train`;
    console.log(`📤 Sending ${samples.length} compiled client samples to Flask retraining pipeline...`);

    const response = await axios.post(aiUrl, { samples }, { timeout: 15000 });

    if (response.data.success) {
      console.log('✅ Churn Model retraining completed successfully!', response.data.metrics);
      return { success: true, metrics: response.data.metrics };
    }

    return { success: false, error: 'Flask reported training failure' };

  } catch (err) {
    console.error('❌ Churn Model Retraining service failed:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Set up automated monthly cron scheduler (runs on the 1st of every month at midnight)
 */
const startRetrainScheduler = () => {
  cron.schedule('0 0 1 * *', async () => {
    console.log('⏰ Monthly scheduled Churn Model retraining triggered...');
    await retrainChurnModel();
  });
  console.log('⏰ Churn Model Retrain scheduler established (runs on the 1st of every month at midnight)');
};

module.exports = {
  retrainChurnModel,
  startRetrainScheduler
};
