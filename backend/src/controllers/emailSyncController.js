const { syncInboxToDatabase, isImapConfigured } = require('../services/emailSyncService');
const { fetchInboxEmails } = require('../services/emailInboxService');

// POST /api/emails/sync — import inbox into customers + interactions
exports.syncEmails = async (req, res) => {
  try {
    if (!isImapConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'IMAP not configured. Set SMTP_USER and SMTP_PASS (Gmail app password) in backend/.env',
      });
    }

    const limit = Math.min(Number(req.body.limit) || 50, 100);
    const sinceDays = Math.min(Number(req.body.sinceDays) || 30, 90);

    const stats = await syncInboxToDatabase({
      limit,
      sinceDays,
      assignedToUserId: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: {
        message: `Imported ${stats.interactionsCreated} email(s), created ${stats.customersCreated} customer(s).`,
        stats,
      },
    });
  } catch (err) {
    console.error('Email sync error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/emails/preview — fetch inbox without saving (admin debug)
exports.previewEmails = async (req, res) => {
  try {
    if (!isImapConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'IMAP not configured. Set SMTP_USER and SMTP_PASS in backend/.env',
      });
    }

    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const sinceDays = Math.min(Number(req.query.sinceDays) || 14, 90);
    const emails = await fetchInboxEmails({ limit, sinceDays });

    res.status(200).json({
      success: true,
      count: emails.length,
      data: emails.map((e) => ({
        from: e.fromEmail,
        name: e.fromName,
        subject: e.subject,
        date: e.date,
        preview: (e.text || '').slice(0, 120),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
