const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const SentimentLog = require('../models/SentimentLog');

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    let customerFilter = {};

    // sales_manager only sees their assigned customers
    if (req.user.role === 'sales_manager') {
      customerFilter.assignedTo = req.user._id;
    }

    const totalCustomers = await Customer.countDocuments(customerFilter);
    const atRiskCount = await Customer.countDocuments({ ...customerFilter, status: 'at_risk' });
    const positiveCount = await Customer.countDocuments({ ...customerFilter, overallSentiment: 'positive' });
    const negativeCount = await Customer.countDocuments({ ...customerFilter, overallSentiment: 'negative' });

    // Get customers with high churn score
    const churnAlerts = await Customer.find({
      ...customerFilter,
      churnScore: { $gte: 0.7 },
    })
      .select('name email churnScore status')
      .sort({ churnScore: -1 })
      .limit(5);

    // Get 5 most recent interactions
    const recentInteractions = await Interaction.find()
      .populate('customerId', 'name email')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        atRiskCount,
        positiveCount,
        negativeCount,
        recentInteractions,
        churnAlerts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/dashboard/sentiment-trend?days=7
exports.getSentimentTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    // Build date labels for last N days
    const labels = [];
    const positiveData = [];
    const neutralData = [];
    const negativeData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Format label as "Apr 25"
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(label);

      // Count sentiments for that day
      const [pos, neu, neg] = await Promise.all([
        SentimentLog.countDocuments({
          sentimentLabel: 'positive',
          analyzedAt: { $gte: date, $lt: nextDate },
        }),
        SentimentLog.countDocuments({
          sentimentLabel: 'neutral',
          analyzedAt: { $gte: date, $lt: nextDate },
        }),
        SentimentLog.countDocuments({
          sentimentLabel: 'negative',
          analyzedAt: { $gte: date, $lt: nextDate },
        }),
      ]);

      positiveData.push(pos);
      neutralData.push(neu);
      negativeData.push(neg);
    }

    res.status(200).json({
      success: true,
      data: {
        labels,
        positive: positiveData,
        neutral: neutralData,
        negative: negativeData,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/dashboard/churn-distribution
exports.getChurnDistribution = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'sales_manager') {
      filter.assignedTo = req.user._id;
    }

    const [high, medium, low] = await Promise.all([
      Customer.countDocuments({ ...filter, churnScore: { $gte: 0.7 } }),
      Customer.countDocuments({ ...filter, churnScore: { $gte: 0.4, $lt: 0.7 } }),
      Customer.countDocuments({ ...filter, churnScore: { $lt: 0.4 } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        high,
        medium,
        low,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};