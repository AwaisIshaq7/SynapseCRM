const Interaction = require('../models/Interaction');
const Customer = require('../models/Customer');
const { syncInboxToDatabase, isImapConfigured } = require('../services/emailSyncService');
const { sendReply } = require('../services/emailReplyService');

const scopeFilter = async (user, customerId) => {
  const filter = { type: 'email' };
  if (customerId) filter.customerId = customerId;

  if (user.role === 'sales_manager') {
    const mine = await Customer.find({ assignedTo: user._id }).select('_id');
    const ids = mine.map((c) => c._id);
    if (customerId && !ids.some((id) => id.toString() === customerId)) {
      return { error: 'Access denied', status: 403 };
    }
    filter.customerId = customerId ? customerId : { $in: ids };
  }
  return { filter };
};

// GET /api/emails/mailbox
exports.listMailbox = async (req, res) => {
  try {
    const scoped = await scopeFilter(req.user, req.query.customerId);
    if (scoped.error) return res.status(scoped.status).json({ success: false, error: scoped.error });

    const emails = await Interaction.find(scoped.filter)
      .populate('customerId', 'name email company priority overallSentiment')
      .populate('userId', 'name')
      .sort({ date: -1 })
      .limit(Math.min(Number(req.query.limit) || 300, 500));

    res.status(200).json({ success: true, count: emails.length, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/emails/:id
exports.getEmail = async (req, res) => {
  try {
    const email = await Interaction.findOne({ _id: req.params.id, type: 'email' })
      .populate('customerId', 'name email company priority overallSentiment phone')
      .populate('userId', 'name email');

    if (!email) return res.status(404).json({ success: false, error: 'Email not found' });

    if (req.user.role === 'sales_manager') {
      const customer = await Customer.findById(email.customerId._id || email.customerId).select('assignedTo');
      if (customer?.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    res.status(200).json({ success: true, data: email });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/emails/reply
exports.replyToEmail = async (req, res) => {
  try {
    const { interactionId, customerId, message, subject } = req.body;

    if (interactionId) {
      const original = await Interaction.findById(interactionId).populate('customerId');
      if (!original) return res.status(404).json({ success: false, error: 'Email not found' });
      if (req.user.role === 'sales_manager') {
        const c = original.customerId;
        const assigned = c?.assignedTo?.toString();
        if (assigned && assigned !== req.user._id.toString()) {
          return res.status(403).json({ success: false, error: 'Access denied' });
        }
      }
    }

    const result = await sendReply({
      interactionId,
      customerId,
      userId: req.user._id,
      message,
      subject,
    });

    res.status(201).json({
      success: true,
      data: {
        message: `Reply sent to ${result.customer.email}`,
        interaction: result.interaction,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/emails/sync
exports.syncEmails = async (req, res) => {
  try {
    if (!isImapConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'IMAP not configured. Set SMTP_USER and SMTP_PASS (Gmail app password) in backend/.env',
      });
    }

    const limit = Math.min(Number(req.body.limit) || Number(process.env.EMAIL_SYNC_LIMIT) || 200, 500);
    const sinceDays = Math.min(Number(req.body.sinceDays) || Number(process.env.EMAIL_SYNC_SINCE_DAYS) || 180, 365);

    const stats = await syncInboxToDatabase({
      limit,
      sinceDays,
      assignedToUserId: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: {
        message: `Imported ${stats.interactionsCreated} new email(s). ${stats.skippedDuplicate} already in CRM.`,
        stats,
      },
    });
  } catch (err) {
    console.error('Email sync error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/emails/config-status — which keys are set (no secrets)
exports.getConfigStatus = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      smtpConfigured: isImapConfigured(),
      groqConfigured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key'),
      imapUser: process.env.IMAP_USER || process.env.SMTP_USER || null,
      keysHelp: {
        SMTP_USER_SMTP_PASS: 'Gmail address + 16-char App Password — required for sync & sending replies',
        GROQ_API_KEY: 'Optional — AI suggested replies (get free key at console.groq.com)',
        AI_SERVICE_URL: 'Optional — Python service on port 8000 for advanced sentiment',
      },
    },
  });
};
