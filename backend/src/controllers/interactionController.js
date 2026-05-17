const Interaction = require('../models/Interaction');
const Customer = require('../models/Customer');
const SentimentLog = require('../models/SentimentLog');
const User = require('../models/User');
const axios = require('axios');
const { sendSentimentAlert } = require('../services/emailService');
const { createSentimentNotification } = require('./notificationController');

// GET /api/customers/:id/interactions
exports.getInteractions = async (req, res) => {
  try {
    // Ensure customer exists and enforce role-based access: sales_manager can
    // only view interactions for customers assigned to them.
    const customer = await Customer.findById(req.params.id).select('assignedTo');
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    if (req.user.role === 'sales_manager') {
      const assignedTo = customer.assignedTo ? customer.assignedTo.toString() : null;
      if (assignedTo !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await Interaction.countDocuments({ customerId: req.params.id });
    const interactions = await Interaction.find({ customerId: req.params.id })
      .populate('userId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: interactions.length,
      data: interactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/customers/:id/interactions
exports.createInteraction = async (req, res) => {
  try {
    const { type, content, date } = req.body;

    // Check customer exists
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    if (req.user.role === 'sales_manager') {
      const assignedTo = customer.assignedTo ? customer.assignedTo.toString() : null;
      if (assignedTo !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    // Save interaction first with null sentiment (returns instantly to the frontend)
    const interaction = await Interaction.create({
      customerId: req.params.id,
      userId: req.user._id,
      type,
      content,
      date,
      sentimentScore: null,
      sentimentLabel: null,
    });

    // Always update last contact date
    await Customer.findByIdAndUpdate(req.params.id, {
      lastContactDate: date,
    });

    // ⭐ HIGH PERFORMANCE OPTIMIZATION ⭐
    // Execute AI sentiment processing & churn prediction asynchronously in the background.
    // This eliminates Render free tier spin-up or network latency bottlenecks, keeping the main HTTP thread completely non-blocking.
    (async () => {
      try {
        const aiResponse = await axios.post(
          `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/analyze`,
          { text: content },
          { timeout: 15000 } // 15s timeout for Render cold-starts
        );

        const sentimentScore = aiResponse.data.score;
        const sentimentLabel = aiResponse.data.sentiment;

        // Update interaction with sentiment
        await Interaction.findByIdAndUpdate(interaction._id, {
          sentimentScore,
          sentimentLabel
        });

        // Save to SentimentLog
        await SentimentLog.create({
          customerId: req.params.id,
          interactionId: interaction._id,
          sentimentScore,
          sentimentLabel,
        });

        // Update customer overall sentiment
        await updateCustomerSentiment(req.params.id);

        // Recalculate customer churn probability score in the background
        await recalculateCustomerChurn(req.params.id);

        // Check for negative sentiment streak alerts
        await checkSentimentAlert(req.params.id, req.user._id);

        console.log(`✅ Background AI processing complete for customer ${req.params.id}`);
      } catch (aiError) {
        console.warn(`⚠️ Background AI analysis failed for customer ${req.params.id}:`, aiError.message);
      }
    })();

    res.status(201).json({
      success: true,
      data: interaction,
      message: 'Interaction logged (AI analysis processing in background)',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const checkSentimentAlert = async (customerId, userId) => {
  const recent = await Interaction.find({
    customerId,
    sentimentLabel: { $ne: null },
  }).sort({ createdAt: -1 }).limit(3);

  if (recent.length === 3 && recent.every((i) => i.sentimentLabel === 'negative')) {
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { status: 'at_risk' },
      { returnDocument: 'after' }
    );

    const manager = await User.findById(userId).select('name email');
    if (manager && customer) {
      await sendSentimentAlert(manager.email, manager.name, customer.name);
      await createSentimentNotification(manager._id, customer.name);
    }

    console.log(`⚠️ ${customer?.name} flagged at_risk — sentiment alert triggered`);

    return true;
  }

  return false;
};

// DELETE /api/interactions/:interactionId
exports.deleteInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.interactionId);
    if (!interaction) {
      return res.status(404).json({ success: false, error: 'Interaction not found' });
    }

    // Sales managers may only delete interactions for their assigned customers.
    if (req.user.role === 'sales_manager') {
      const customer = await Customer.findById(interaction.customerId).select('assignedTo');
      const assignedTo = customer?.assignedTo ? customer.assignedTo.toString() : null;
      if (assignedTo !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    await Interaction.findByIdAndDelete(req.params.interactionId);

    res.status(200).json({ success: true, message: 'Interaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Helper — recalculate customer overall sentiment from all interactions
const updateCustomerSentiment = async (customerId) => {
  const interactions = await Interaction.find({
    customerId,
    sentimentScore: { $ne: null },
  });

  if (interactions.length === 0) return;

  const avg =
    interactions.reduce((sum, i) => sum + i.sentimentScore, 0) / interactions.length;

  let overallSentiment = 'neutral';
  if (avg >= 0.05) overallSentiment = 'positive';
  if (avg <= -0.05) overallSentiment = 'negative';

  await Customer.findByIdAndUpdate(customerId, { overallSentiment });
};

// Helper — Recalculate Churn Probability Score for a single customer in real-time
const recalculateCustomerChurn = async (customerId) => {
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return;

    // Fetch the 10 most recent interactions that have sentiment scores
    const interactions = await Interaction.find({
      customerId,
      sentimentScore: { $ne: null },
    }).sort({ date: -1 }).limit(10);

    if (interactions.length === 0) return;

    // Days since last contact
    const lastContact = customer.lastContactDate || new Date();
    const daysSinceLastContact = Math.max(0, Math.floor(
      (new Date() - new Date(lastContact)) / (1000 * 60 * 60 * 24)
    ));

    // Calculate average sentiment score
    const avgSentimentScore =
      interactions.reduce((sum, i) => sum + i.sentimentScore, 0) / interactions.length;

    const interactionCount = interactions.length;

    // Calculate interaction frequency (count / days spanned)
    const oldestDate = interactions[interactions.length - 1].date;
    const daySpan = Math.max(
      Math.floor((new Date() - new Date(oldestDate)) / (1000 * 60 * 60 * 24)),
      1
    );
    const interactionFrequency = interactionCount / daySpan;

    // Post to Flask ML service for prediction
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/churn-risk`,
      {
        daysSinceLastContact,
        avgSentimentScore: parseFloat(avgSentimentScore.toFixed(4)),
        interactionCount,
        interactionFrequency: parseFloat(interactionFrequency.toFixed(4)),
      },
      { timeout: 8000 }
    );

    const { churnScore } = response.data;

    // Update customer churnScore and status
    const newStatus =
      churnScore >= 0.7
        ? 'at_risk'
        : customer.status === 'at_risk'
        ? 'active'
        : customer.status;

    await Customer.findByIdAndUpdate(customerId, {
      churnScore,
      status: newStatus,
    });

  } catch (err) {
    console.log(`⚠️ Recalculate churn failed for ${customerId}:`, err.message);
  }
};
