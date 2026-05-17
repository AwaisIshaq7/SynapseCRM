const axios = require('axios');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const SentimentLog = require('../models/SentimentLog');
const User = require('../models/User');
const { fetchInboxEmails, isImapConfigured } = require('./emailInboxService');

const companyFromEmail = (email) => {
  const domain = email.split('@')[1];
  if (!domain) return '';
  const name = domain.split('.')[0];
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
};

const analyzeSentiment = async (text) => {
  try {
    const res = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/analyze`,
      { text },
      { timeout: 5000 }
    );
    return { score: res.data.score, label: res.data.sentiment };
  } catch {
    return { score: null, label: null };
  }
};

const updateCustomerSentiment = async (customerId) => {
  const interactions = await Interaction.find({
    customerId,
    sentimentScore: { $ne: null },
  });
  if (!interactions.length) return;

  const avg = interactions.reduce((sum, i) => sum + i.sentimentScore, 0) / interactions.length;
  let overallSentiment = 'neutral';
  if (avg >= 0.05) overallSentiment = 'positive';
  if (avg <= -0.05) overallSentiment = 'negative';

  await Customer.findByIdAndUpdate(customerId, { overallSentiment });
};

/**
 * Import inbox emails as customers + email interactions.
 */
const syncInboxToDatabase = async ({
  limit = Number(process.env.EMAIL_SYNC_LIMIT) || 50,
  sinceDays = Number(process.env.EMAIL_SYNC_SINCE_DAYS) || 30,
  assignedToUserId = null,
} = {}) => {
  if (!isImapConfigured()) {
    throw new Error('Email sync requires SMTP_USER and SMTP_PASS in backend/.env');
  }

  const emails = await fetchInboxEmails({ limit, sinceDays });
  const stats = {
    fetched: emails.length,
    customersCreated: 0,
    interactionsCreated: 0,
    skippedDuplicate: 0,
    skippedOther: 0,
  };

  let assignee = assignedToUserId ? await User.findById(assignedToUserId) : null;
  if (!assignee) {
    assignee =
      (await User.findOne({ role: 'admin', emailVerified: { $ne: false } })) ||
      (await User.findOne({ role: 'sales_manager' })) ||
      (await User.findOne());
  }
  if (!assignee) {
    throw new Error('No user found to assign imported customers. Register or seed a user first.');
  }

  for (const mail of emails) {
    const existingInteraction = await Interaction.findOne({
      externalMessageId: mail.messageId,
    });
    if (existingInteraction) {
      stats.skippedDuplicate += 1;
      continue;
    }

    let customer = await Customer.findOne({ email: mail.fromEmail });
    if (!customer) {
      try {
        customer = await Customer.create({
          name: mail.fromName,
          email: mail.fromEmail,
          company: companyFromEmail(mail.fromEmail),
          status: 'active',
          assignedTo: assignee._id,
          lastContactDate: mail.date,
        });
        stats.customersCreated += 1;
      } catch (err) {
        if (err.code === 11000) {
          customer = await Customer.findOne({ email: mail.fromEmail });
        } else {
          stats.skippedOther += 1;
          continue;
        }
      }
    }

    const content = `Subject: ${mail.subject}\n\n${mail.text || '(empty body)'}`;
    const { score, label } = await analyzeSentiment(content);

    const interaction = await Interaction.create({
      customerId: customer._id,
      userId: assignee._id,
      type: 'email',
      content,
      date: mail.date,
      externalMessageId: mail.messageId,
      emailSubject: mail.subject,
      emailFrom: mail.fromEmail,
      sentimentScore: score,
      sentimentLabel: label,
    });

    if (score != null) {
      await SentimentLog.create({
        customerId: customer._id,
        interactionId: interaction._id,
        sentimentScore: score,
        sentimentLabel: label,
      });
      await updateCustomerSentiment(customer._id);
    }

    await Customer.findByIdAndUpdate(customer._id, {
      lastContactDate: mail.date,
    });

    stats.interactionsCreated += 1;
  }

  return stats;
};

module.exports = { syncInboxToDatabase, isImapConfigured };
