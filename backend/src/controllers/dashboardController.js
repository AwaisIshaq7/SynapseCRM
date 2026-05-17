const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const SentimentLog = require('../models/SentimentLog');
const User = require('../models/User');
const axios = require('axios');
const { retrainChurnModel } = require('../services/churnRetrainService');

const getScopedCustomerIds = async (req) => {
  if (req.user.role !== 'sales_manager') return null;
  const customers = await Customer.find({ assignedTo: req.user._id }).select('_id');
  return customers.map((customer) => customer._id);
};

const parseTrendDays = (query) => {
  if (query.from && query.to) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to >= from) {
      return Math.min(Math.max(Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1, 1), 90);
    }
  }

  if (query.range) {
    const match = String(query.range).match(/^(\d+)d$/);
    if (match) return Math.min(Math.max(parseInt(match[1], 10), 1), 90);
  }

  return Math.min(Math.max(parseInt(query.days, 10) || 7, 1), 90);
};

exports.getSummary = async (req, res) => {
  try {
    let customerFilter = {};
    let interactionFilter = {};

    if (req.user.role === 'sales_manager') {
      customerFilter.assignedTo = req.user._id;
      // Get manager's assigned customer IDs first
      const myCustomers = await Customer.find({ assignedTo: req.user._id }).select('_id');
      interactionFilter.customerId = { $in: myCustomers.map(c => c._id) };
    }

    // ⭐ HIGH PERFORMANCE OPTIMIZATION ⭐
    // Fire all core KPI counts, alerts, and recent timeline lists in parallel
    const [
      totalCustomers,
      atRiskCount,
      activeCount,
      positiveCount,
      negativeCount,
      churnAlerts,
      recentInteractions
    ] = await Promise.all([
      Customer.countDocuments(customerFilter),
      Customer.countDocuments({ ...customerFilter, status: 'at_risk' }),
      Customer.countDocuments({ ...customerFilter, status: 'active' }),
      Customer.countDocuments({ ...customerFilter, overallSentiment: 'positive' }),
      Customer.countDocuments({ ...customerFilter, overallSentiment: 'negative' }),
      Customer.find({ ...customerFilter, churnScore: { $gte: 0.7 } })
        .select('name email churnScore status company')
        .sort({ churnScore: -1 })
        .limit(5),
      Interaction.find(interactionFilter)
        .populate('customerId', 'name email company')
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    let salesManagerStats = null;
    if (req.user.role === 'admin') {
      // Aggregate all manager customer counts and at-risk counts in a single query
      const [managers, aggregationResults] = await Promise.all([
        User.find({ role: 'sales_manager' }).select('name email createdAt'),
        Customer.aggregate([
          { $match: { assignedTo: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: '$assignedTo',
              customerCount: { $sum: 1 },
              atRiskCount: { $sum: { $cond: [{ $eq: ['$status', 'at_risk'] }, 1, 0] } }
            }
          }
        ])
      ]);

      const statsMap = new Map(aggregationResults.map(r => [r._id.toString(), r]));

      salesManagerStats = managers.map(manager => {
        const stats = statsMap.get(manager._id.toString()) || { customerCount: 0, atRiskCount: 0 };
        return {
          _id: manager._id,
          name: manager.name,
          email: manager.email,
          customerCount: stats.customerCount,
          atRiskCount: stats.atRiskCount,
        };
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        atRiskCount,
        activeCount,
        positiveCount,
        negativeCount,
        recentInteractions,
        churnAlerts,
        salesManagerStats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSentimentTrend = async (req, res) => {
  try {
    const days = parseTrendDays(req.query);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const customerIds = await getScopedCustomerIds(req);
    const matchStage = { analyzedAt: { $gte: startDate } };
    if (customerIds) matchStage.customerId = { $in: customerIds };

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$analyzedAt' } },
            label: '$sentimentLabel',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ];

    const results = await SentimentLog.aggregate(pipeline);

    // Build date-indexed map
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = { positive: 0, neutral: 0, negative: 0 };
    }

    for (const row of results) {
      if (dateMap[row._id.date] && row._id.label) {
        dateMap[row._id.date][row._id.label] = row.count;
      }
    }

    const labels = [];
    const positiveData = [];
    const neutralData = [];
    const negativeData = [];

    for (const [dateStr, counts] of Object.entries(dateMap)) {
      const d = new Date(dateStr + 'T00:00:00');
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      positiveData.push(counts.positive);
      neutralData.push(counts.neutral);
      negativeData.push(counts.negative);
    }

    res.status(200).json({
      success: true,
      data: { labels, positive: positiveData, neutral: neutralData, negative: negativeData },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getKpiTrends = async (req, res) => {
  try {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 30);

    const previousStart = new Date(now);
    previousStart.setDate(previousStart.getDate() - 60);

    const customerFilter = {};
    if (req.user.role === 'sales_manager') {
      customerFilter.assignedTo = req.user._id;
    }

    const currentCustomerFilter = { ...customerFilter, createdAt: { $gte: currentStart } };
    const previousCustomerFilter = {
      ...customerFilter,
      createdAt: { $gte: previousStart, $lt: currentStart },
    };

    const customerIds = await getScopedCustomerIds(req);
    const scopedInteractions = customerIds ? { customerId: { $in: customerIds } } : {};
    const currentInteractionFilter = { ...scopedInteractions, createdAt: { $gte: currentStart } };
    const previousInteractionFilter = {
      ...scopedInteractions,
      createdAt: { $gte: previousStart, $lt: currentStart },
    };

    const [
      currentCustomers,
      previousCustomers,
      currentAtRisk,
      previousAtRisk,
      currentPositive,
      previousPositive,
      currentNegative,
      previousNegative,
    ] = await Promise.all([
      Customer.countDocuments(currentCustomerFilter),
      Customer.countDocuments(previousCustomerFilter),
      Customer.countDocuments({ ...currentCustomerFilter, status: 'at_risk' }),
      Customer.countDocuments({ ...previousCustomerFilter, status: 'at_risk' }),
      Interaction.countDocuments({ ...currentInteractionFilter, sentimentLabel: 'positive' }),
      Interaction.countDocuments({ ...previousInteractionFilter, sentimentLabel: 'positive' }),
      Interaction.countDocuments({ ...currentInteractionFilter, sentimentLabel: 'negative' }),
      Interaction.countDocuments({ ...previousInteractionFilter, sentimentLabel: 'negative' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers: currentCustomers - previousCustomers,
        atRiskCount: currentAtRisk - previousAtRisk,
        positiveSentiment: currentPositive - previousPositive,
        negativeSentiment: currentNegative - previousNegative,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

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

    res.status(200).json({ success: true, data: { high, medium, low } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAdminOverview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // System-wide stats in parallel
    const [totalCustomers, totalManagers, atRiskTotal, activeTotal] = await Promise.all([
      Customer.countDocuments(),
      User.countDocuments({ role: 'sales_manager' }),
      Customer.countDocuments({ status: 'at_risk' }),
      Customer.countDocuments({ status: 'active' }),
    ]);

    // Aggregation: per-manager customer stats in one query
    const managerCustomerStats = await Customer.aggregate([
      { $match: { assignedTo: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          customerCount: { $sum: 1 },
          atRiskCount: { $sum: { $cond: [{ $eq: ['$status', 'at_risk'] }, 1, 0] } },
          activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveCount: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          totalChurn: { $sum: '$churnScore' },
          customerIds: { $push: '$_id' },
          customers: {
            $push: {
              _id: '$_id', name: '$name', status: '$status',
              churnScore: '$churnScore', overallSentiment: '$overallSentiment',
              company: '$company', email: '$email', createdAt: '$createdAt',
              lastContactDate: '$lastContactDate', assignedTo: '$assignedTo',
            },
          },
        },
      },
    ]);

    // Build a lookup map for manager stats
    const statsMap = new Map();
    for (const stat of managerCustomerStats) {
      statsMap.set(stat._id.toString(), stat);
    }

    // Fetch managers
    const managers = await User.find({ role: 'sales_manager' }).select('name email createdAt');

    // Fetch recent interactions for all managers' customers in one query
    const allCustomerIds = managerCustomerStats.flatMap(s => s.customerIds);
    const allRecentInteractions = await Interaction.find({ customerId: { $in: allCustomerIds } })
      .sort({ createdAt: -1 })
      .limit(managers.length * 8)
      .populate('customerId', 'name company email status')
      .populate('userId', 'name role');

    // Group interactions by customer's assignedTo manager
    const interactionsByManager = new Map();
    for (const interaction of allRecentInteractions) {
      const custId = interaction.customerId?._id?.toString();
      if (!custId) continue;
      // Find which manager owns this customer
      for (const stat of managerCustomerStats) {
        if (stat.customerIds.some(id => id.toString() === custId)) {
          const mgrId = stat._id.toString();
          if (!interactionsByManager.has(mgrId)) interactionsByManager.set(mgrId, []);
          const arr = interactionsByManager.get(mgrId);
          if (arr.length < 8) arr.push(interaction);
          break;
        }
      }
    }

    const managerDetails = managers.map(m => {
      const mId = m._id.toString();
      const stat = statsMap.get(mId) || { customerCount: 0, atRiskCount: 0, activeCount: 0, inactiveCount: 0, totalChurn: 0, customers: [] };
      const avgChurn = stat.customerCount ? (stat.totalChurn / stat.customerCount).toFixed(2) : 0;

      return {
        _id: m._id,
        name: m.name,
        email: m.email,
        joinedAt: m.createdAt,
        customerCount: stat.customerCount,
        atRiskCount: stat.atRiskCount,
        activeCount: stat.activeCount,
        inactiveCount: stat.inactiveCount,
        avgChurnScore: parseFloat(avgChurn),
        customers: stat.customers,
        recentInteractions: interactionsByManager.get(mId) || [],
      };
    });

    res.status(200).json({
      success: true,
      data: {
        systemStats: { totalCustomers, totalManagers, atRiskTotal, activeTotal },
        managerDetails,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSystemStatus = async (req, res) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // 1. Dynamic Check on Flask AI Microservice
    const aiStart = Date.now();
    let aiStatus = 'offline';
    let aiLatency = 0;
    try {
      const aiRes = await axios.get(`${aiUrl}/health`, { timeout: 2000 });
      if (aiRes.status === 200) {
        aiStatus = 'active';
        aiLatency = Date.now() - aiStart;
      }
    } catch (e) {
      aiStatus = 'offline';
    }

    // 2. Dynamic Check on MongoDB DB Connection
    const dbStart = Date.now();
    await Customer.estimatedDocumentCount();
    const dbLatency = Date.now() - dbStart;

    res.status(200).json({
      success: true,
      data: {
        ai: {
          status: aiStatus,
          latency: aiLatency || 5, // fallback if fast local
        },
        db: {
          status: 'active',
          latency: dbLatency || 2, // fallback if fast local
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.triggerModelRetrain = async (req, res) => {
  try {
    const result = await retrainChurnModel();
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'RandomForest Churn model retrained dynamically from live data!',
        metrics: result.metrics,
        error: null
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Retraining failed',
      metrics: null,
      error: result.error
    });
  } catch (err) {
    res.status(500).json({ success: false, metrics: null, error: err.message });
  }
};

exports.getPerformanceMetrics = async (req, res) => {
  try {
    let userId = req.user._id;
    let isGlobal = req.user.role === 'admin';

    let customerFilter = {};

    if (!isGlobal) {
      customerFilter.assignedTo = userId;
    }

    // Fetch portfolio customers
    const myCustomers = await Customer.find(customerFilter);

    // Calculate Portfolio totals based on deterministic values
    let totalCustomers = myCustomers.length;
    let activeCount = myCustomers.filter(c => c.status === 'active').length;
    let atRiskCount = myCustomers.filter(c => c.status === 'at_risk').length;
    let positiveCount = myCustomers.filter(c => c.overallSentiment === 'positive').length;
    let neutralCount = myCustomers.filter(c => c.overallSentiment === 'neutral').length;
    let negativeCount = myCustomers.filter(c => c.overallSentiment === 'negative').length;

    // Closed / Won Revenue: positive sentiment active customers get $12,500
    // Pipeline Revenue: neutral ($8,000) + negative ($4,000)
    let closedRevenue = positiveCount * 12500;
    let pipelineRevenue = (neutralCount * 8000) + (negativeCount * 4000);
    let targetQuota = 100000; // $100k quota benchmark

    // Churn risk ratios
    let highRiskCount = myCustomers.filter(c => c.churnScore >= 0.7).length;
    let mediumRiskCount = myCustomers.filter(c => c.churnScore >= 0.4 && c.churnScore < 0.7).length;
    let lowRiskCount = myCustomers.filter(c => c.churnScore < 0.4).length;

    // Interaction activity touchpoints count over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let activityFilter = {
      date: { $gte: thirtyDaysAgo }
    };

    if (!isGlobal) {
      activityFilter.userId = userId;
    } else {
      // For Admin, get all interactions in last 30 days
    }

    // Count types in parallel
    const [emailCount, callCount, meetingCount] = await Promise.all([
      Interaction.countDocuments({ ...activityFilter, type: 'email' }),
      Interaction.countDocuments({ ...activityFilter, type: 'call' }),
      Interaction.countDocuments({ ...activityFilter, type: 'meeting' })
    ]);

    // High-value watchlist: Top 5 accounts sorted by value and churn
    const watchlist = myCustomers
      .map(c => {
        let val = c.overallSentiment === 'positive' ? 15000 : c.overallSentiment === 'neutral' ? 10000 : 5000;
        return {
          _id: c._id,
          name: c.name,
          company: c.company,
          status: c.status,
          churnScore: c.churnScore,
          overallSentiment: c.overallSentiment,
          value: val
        };
      })
      .sort((a, b) => b.value - a.value || b.churnScore - a.churnScore)
      .slice(0, 5);

    // Generate recent quota achievements/milestones
    let achievements = [];
    if (closedRevenue >= targetQuota) {
      achievements.push({
        title: 'Quota Exceeded! 🏆',
        desc: `Closed $${closedRevenue.toLocaleString()} out of $${targetQuota.toLocaleString()} target. Outstanding portfolio performance!`,
        date: new Date()
      });
    } else if (closedRevenue > targetQuota * 0.70) {
      achievements.push({
        title: 'Quota in Sight 🎯',
        desc: `Sarah is at ${Math.round((closedRevenue / targetQuota) * 100)}% of quota target. A few positive follow-ups to close!`,
        date: new Date()
      });
    } else {
      achievements.push({
        title: 'Pipeline Building 📈',
        desc: `Portfolio closed value: $${closedRevenue.toLocaleString()} with $${pipelineRevenue.toLocaleString()} active pipeline waiting to convert.`,
        date: new Date()
      });
    }

    if (emailCount >= 10 || callCount >= 5) {
      achievements.push({
        title: 'Outreach Excellence Medal 🥇',
        desc: `Logged ${emailCount} emails and ${callCount} phone calls over the last 30 days. Communications remain highly active.`,
        date: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId,
        isGlobal,
        summary: {
          totalCustomers,
          activeCount,
          atRiskCount,
          closedRevenue,
          pipelineRevenue,
          targetQuota,
          quotaPercentage: Math.round((closedRevenue / targetQuota) * 100),
        },
        riskMetrics: {
          high: highRiskCount,
          medium: mediumRiskCount,
          low: lowRiskCount
        },
        activityQuota: {
          emails: { current: emailCount, target: 40 },
          calls: { current: callCount, target: 20 },
          meetings: { current: meetingCount, target: 8 }
        },
        watchlist,
        achievements
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.exportPortfolioCSV = async (req, res) => {
  try {
    let customerFilter = {};
    if (req.user.role === 'sales_manager') {
      customerFilter.assignedTo = req.user._id;
    }

    const customers = await Customer.find(customerFilter).populate('assignedTo', 'name');

    // Compile RFC 4180 CSV with cell quote-escapes
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Churn Risk %', 'Sentiment', 'Assigned To', 'Last Contact Date'];
    const rows = customers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${c.status}"`,
      `"${(c.churnScore * 100).toFixed(0)}%"`,
      `"${c.overallSentiment}"`,
      `"${c.assignedTo?.name || 'Unassigned'}"`,
      `"${c.lastContactDate ? c.lastContactDate.toISOString() : 'No contact history'}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=portfolio_export.csv');
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.exportSystemJSON = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: Administrators only' });
    }

    const [customers, interactions, notifications, users] = await Promise.all([
      Customer.find().lean(),
      Interaction.find().lean(),
      Notification.find().lean(),
      User.find().select('-password').lean()
    ]);

    const backupData = {
      exportDate: new Date().toISOString(),
      system: 'SynapseCRM Master System Backup',
      stats: {
        customersCount: customers.length,
        interactionsCount: interactions.length,
        notificationsCount: notifications.length,
        usersCount: users.length
      },
      data: {
        customers,
        interactions,
        notifications,
        users
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=synapse_crm_backup.json');
    res.status(200).json(backupData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
