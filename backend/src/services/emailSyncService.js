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

const { analyzeEmailWithAI, updateCustomerFromInteractions } = require('./emailIntelligenceService');
const { cleanEmailBody } = require('../utils/emailBodyCleaner');

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

    const cleanedBody = cleanEmailBody(mail.text || '') || '(empty body)';
    const content = `Subject: ${mail.subject}\n\n${cleanedBody}`;
    const analysis = await analyzeEmailWithAI({
      subject: mail.subject,
      body: cleanedBody,
      daysSinceContact: 0,
      churnScore: customer.churnScore || 0,
    });

    const interaction = await Interaction.create({
      customerId: customer._id,
      userId: assignee._id,
      type: 'email',
      content,
      emailBody: cleanedBody,
      date: mail.date,
      externalMessageId: mail.messageId,
      emailSubject: mail.subject,
      emailFrom: mail.fromEmail,
      emailDirection: 'inbound',
      sentimentScore: analysis?.score ?? null,
      sentimentLabel: analysis?.sentiment ?? null,
      priority: analysis?.priority ?? 'medium',
      priorityScore: analysis?.priorityScore ?? 50,
      emailInsight: analysis?.insight ?? '',
    });

    if (analysis?.score != null) {
      await SentimentLog.create({
        customerId: customer._id,
        interactionId: interaction._id,
        sentimentScore: analysis.score,
        sentimentLabel: analysis.sentiment,
      });
      await updateCustomerFromInteractions(customer._id);
    }

    await Customer.findByIdAndUpdate(customer._id, {
      lastContactDate: mail.date,
    });

    stats.interactionsCreated += 1;
  }

  return stats;
};

module.exports = { syncInboxToDatabase, isImapConfigured };
