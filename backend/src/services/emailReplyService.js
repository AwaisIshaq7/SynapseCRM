const Interaction = require('../models/Interaction');
const Customer = require('../models/Customer');
const { sendCustomerReplyEmail, isMailConfigured } = require('./emailService');
const { analyzeEmailWithAI, updateCustomerFromInteractions } = require('./emailIntelligenceService');

const sendReply = async ({ interactionId, customerId, userId, message, subject }) => {
  if (!isMailConfigured()) {
    throw new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS in backend/.env');
  }
  if (!message?.trim()) {
    throw new Error('Reply message is required');
  }

  let customer;
  let original = null;

  if (interactionId) {
    original = await Interaction.findById(interactionId).populate('customerId');
    if (!original || original.type !== 'email') {
      throw new Error('Email not found');
    }
    customer = original.customerId;
  } else if (customerId) {
    customer = await Customer.findById(customerId);
    original = await Interaction.findOne({ customerId, type: 'email' }).sort({ date: -1 });
  } else {
    throw new Error('interactionId or customerId is required');
  }

  if (!customer) throw new Error('Customer not found');

  const replySubject =
    subject ||
    (original?.emailSubject ? `Re: ${original.emailSubject.replace(/^Re:\s*/i, '')}` : `Message from SynapseCRM`);

  const mailResult = await sendCustomerReplyEmail({
    to: customer.email,
    subject: replySubject,
    body: message.trim(),
    inReplyTo: original?.externalMessageId,
  });

  if (mailResult?.skipped) {
    throw new Error('Could not send email — check SMTP settings');
  }

  const content = `Subject: ${replySubject}\n\n${message.trim()}`;
  const analysis = await analyzeEmailWithAI({
    subject: replySubject,
    body: message.trim(),
    churnScore: customer.churnScore || 0,
  });

  const outbound = await Interaction.create({
    customerId: customer._id,
    userId,
    type: 'email',
    content,
    emailBody: message.trim(),
    emailSubject: replySubject,
    emailFrom: process.env.SMTP_USER,
    emailTo: customer.email,
    emailDirection: 'outbound',
    inReplyTo: original?._id?.toString(),
    date: new Date(),
    externalMessageId: `outbound-${Date.now()}-${customer._id}`,
    sentimentScore: analysis?.score ?? null,
    sentimentLabel: analysis?.sentiment ?? null,
    priority: analysis?.priority ?? 'low',
    priorityScore: analysis?.priorityScore ?? 30,
    emailInsight: 'Outbound reply sent from SynapseCRM.',
  });

  await Customer.findByIdAndUpdate(customer._id, { lastContactDate: new Date() });
  if (analysis?.score != null) {
    await updateCustomerFromInteractions(customer._id);
  }

  return { interaction: outbound, customer, mailMessageId: mailResult?.messageId };
};

module.exports = { sendReply };
