const Interaction = require('../models/Interaction');
const Customer = require('../models/Customer');
const SentimentLog = require('../models/SentimentLog');
const User = require('../models/User');
const axios = require('axios');
const { sendSentimentAlert } = require('../utils/emailService');
const { createSentimentNotification } = require('./notificationController');
const { analyzeEmailWithAI, updateCustomerFromInteractions } = require('../services/emailIntelligenceService');

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

    const interactions = await Interaction.find({ customerId: req.params.id })
      .populate('userId', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: interactions.length,
      data: interactions,
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

    // Save interaction first with null sentiment
    const interaction = await Interaction.create({
      customerId: req.params.id,
      userId: req.user._id,
      type,
      content,
      date,
      sentimentScore: null,
      sentimentLabel: null,
    });

    let sentimentScore = null;
    let sentimentLabel = null;

    try {
      if (type === 'email') {
        const analysis = await analyzeEmailWithAI({
          content,
          daysSinceContact: Math.floor(
            (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
          ),
          churnScore: customer.churnScore || 0,
        });
        if (analysis) {
          sentimentScore = analysis.score;
          sentimentLabel = analysis.sentiment;
          interaction.sentimentScore = sentimentScore;
          interaction.sentimentLabel = sentimentLabel;
          interaction.priority = analysis.priority;
          interaction.priorityScore = analysis.priorityScore;
          interaction.emailInsight = analysis.insight;
          await interaction.save();
        }
      } else {
        const aiResponse = await axios.post(
          `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/analyze`,
          { text: content },
          { timeout: 5000 }
        );
        sentimentScore = aiResponse.data.score;
        sentimentLabel = aiResponse.data.sentiment;
        interaction.sentimentScore = sentimentScore;
        interaction.sentimentLabel = sentimentLabel;
        await interaction.save();
      }

      if (sentimentScore != null) {
        await SentimentLog.create({
          customerId: req.params.id,
          interactionId: interaction._id,
          sentimentScore,
          sentimentLabel,
        });
        await updateCustomerFromInteractions(req.params.id);
        await checkSentimentAlert(req.params.id, req.user._id);
      }
    } catch (aiError) {
      console.log('⚠️ AI service not available — interaction saved without sentiment');
    }

    // Always update last contact date
    await Customer.findByIdAndUpdate(req.params.id, {
      lastContactDate: date,
    });

    res.status(201).json({
      success: true,
      data: interaction,
      message: sentimentLabel
        ? 'Interaction logged and analysed'
        : 'Interaction logged (AI analysis pending)',
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

