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

// GET /api/dashboard/sentiment-trend?days=7 or ?range=7d or ?from=2024-01-01&to=2024-01-31
exports.getSentimentTrend = async (req, res) => {
  try {
    const { range = '7d', from, to, days } = req.query;

    let startDate, endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (from && to) {
      // Custom date range
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else if (days) {
      // Legacy support for days parameter
      const daysNum = parseInt(days);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default range support (7d, 14d, 30d, etc.)
      const rangeMatch = range.match(/^(\d+)d$/);
      const daysNum = rangeMatch ? parseInt(rangeMatch[1]) : 7;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);
      startDate.setHours(0, 0, 0, 0);
    }

    // Calculate number of days for labels
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Build date labels and aggregate data
    const labels = [];
    const positiveData = [];
    const neutralData = [];
    const negativeData = [];

    for (let i = 0; i < diffDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);

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

// GET /api/dashboard/trends - KPI Trends
exports.getKPITrends = async (req, res) => {
  try {
    let customerFilter = {};
    if (req.user.role === 'sales_manager') {
      customerFilter.assignedTo = req.user._id;
    }

    // Get current period counts
    const currentTotal = await Customer.countDocuments(customerFilter);
    const currentAtRisk = await Customer.countDocuments({ ...customerFilter, churnScore: { $gt: 0.6 } });
    const currentPositive = await Interaction.countDocuments({ sentimentLabel: 'positive' });
    const currentNegative = await Interaction.countDocuments({ sentimentLabel: 'negative' });

    // Get previous period (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const previousTotal = await Customer.countDocuments({ ...customerFilter, createdAt: { $lt: sevenDaysAgo } });
    const previousAtRisk = await Customer.countDocuments({
      ...customerFilter,
      churnScore: { $gt: 0.6 },
      updatedAt: { $lt: sevenDaysAgo },
    });
    const previousPositive = await Interaction.countDocuments({ sentimentLabel: 'positive', createdAt: { $lt: sevenDaysAgo } });
    const previousNegative = await Interaction.countDocuments({ sentimentLabel: 'negative', createdAt: { $lt: sevenDaysAgo } });

    const calculateTrend = (current, previous) => {
      if (previous === 0) return 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    res.json({
      success: true,
      data: {
        totalCustomers: calculateTrend(currentTotal, previousTotal),
        atRiskCount: calculateTrend(currentAtRisk, previousAtRisk),
        positiveSentiment: calculateTrend(currentPositive, previousPositive),
        negativeSentiment: calculateTrend(currentNegative, previousNegative),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};