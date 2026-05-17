const axios = require('axios');
const Groq = require('groq-sdk');
const { analyzeEmailFallback } = require('../utils/emailAnalysisFallback');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const SentimentLog = require('../models/SentimentLog');

const AI_URL = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

const extractEmailParts = (content, emailSubject) => {
  if (emailSubject) {
    const body = (content || '').replace(/^Subject:\s*.+?\n\n?/is, '').trim();
    return { subject: emailSubject, body: body || content };
  }
  const match = (content || '').match(/^Subject:\s*(.+?)(?:\n\n|\n)([\s\S]*)$/i);
  if (match) {
    return { subject: match[1].trim(), body: match[2].trim() };
  }
  return { subject: '', body: content || '' };
};

const daysSince = (date) => {
  if (!date) return 99;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
};

const analyzeEmailWithAI = async ({ subject, body, content, daysSinceContact, churnScore, emailSubject }) => {
  const parts = content ? extractEmailParts(content, emailSubject) : { subject, body };
  try {
    const res = await axios.post(
      `${AI_URL()}/analyze-email`,
      {
        subject: parts.subject,
        body: parts.body,
        content,
        daysSinceContact,
        churnScore,
      },
      { timeout: 8000 }
    );
    return res.data;
  } catch (err) {
    console.warn('⚠️ Email AI service unavailable, using fallback:', err.message || 'offline');
    return analyzeEmailFallback({
      subject: parts.subject,
      body: parts.body,
      daysSinceContact,
      churnScore,
    });
  }
};

const updateCustomerFromInteractions = async (customerId) => {
  const interactions = await Interaction.find({
    customerId,
    sentimentScore: { $ne: null },
  }).sort({ date: -1 });

  if (!interactions.length) return;

  const avg =
    interactions.reduce((sum, i) => sum + i.sentimentScore, 0) / interactions.length;
  let overallSentiment = 'neutral';
  if (avg >= 0.05) overallSentiment = 'positive';
  if (avg <= -0.05) overallSentiment = 'negative';

  const emailInteractions = interactions.filter((i) => i.type === 'email');
  const latestEmail = emailInteractions[0];

  let priority = 'medium';
  let priorityScore = 50;
  let emailInsight = '';

  if (latestEmail) {
    priority = latestEmail.priority || priority;
    priorityScore = latestEmail.priorityScore ?? priorityScore;
    emailInsight = latestEmail.emailInsight || '';
  }

  const maxPriority = interactions.reduce(
    (best, i) => {
      const order = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (order[i.priority] || 0) > (order[best] || 0) ? i.priority : best;
    },
    priority
  );

  const status =
    maxPriority === 'urgent' || overallSentiment === 'negative'
      ? 'at_risk'
      : undefined;

  const update = {
    overallSentiment,
    priority: maxPriority,
    priorityScore,
    emailInsight,
    lastEmailSubject: latestEmail?.emailSubject || latestEmail?.content?.match(/^Subject:\s*(.+)/i)?.[1] || '',
  };
  if (status) update.status = status;

  await Customer.findByIdAndUpdate(customerId, update);
};

const reanalyzeCustomerEmails = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error('Customer not found');

  const emails = await Interaction.find({ customerId, type: 'email' }).sort({ date: -1 });
  let updated = 0;

  for (const interaction of emails) {
    const analysis = await analyzeEmailWithAI({
      content: interaction.content,
      emailSubject: interaction.emailSubject,
      daysSinceContact: daysSince(interaction.date),
      churnScore: customer.churnScore || 0,
    });

    if (!analysis) continue;

    interaction.sentimentScore = analysis.score;
    interaction.sentimentLabel = analysis.sentiment;
    interaction.priority = analysis.priority;
    interaction.priorityScore = analysis.priorityScore;
    interaction.emailInsight = analysis.insight;
    await interaction.save();

    await SentimentLog.findOneAndUpdate(
      { interactionId: interaction._id },
      {
        customerId,
        interactionId: interaction._id,
        sentimentScore: analysis.score,
        sentimentLabel: analysis.sentiment,
      },
      { upsert: true }
    );
    updated += 1;
  }

  await updateCustomerFromInteractions(customerId);
  const refreshed = await Customer.findById(customerId);
  return { updated, customer: refreshed };
};

const reanalyzeAllCustomers = async () => {
  const customers = await Customer.find();
  let totalUpdated = 0;
  for (const c of customers) {
    const { updated } = await reanalyzeCustomerEmails(c._id);
    totalUpdated += updated;
  }
  return { customers: customers.length, interactionsUpdated: totalUpdated };
};

const getSuggestedResponse = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error('Customer not found');

  const emails = await Interaction.find({ customerId, type: 'email' })
    .sort({ date: -1 })
    .limit(3);

  const latest = emails[0];
  if (!latest) {
    return {
      suggestedReply: `Hi ${customer.name.split(' ')[0]},\n\nThank you for being a valued customer. I wanted to check in and see if there is anything we can help you with.\n\nBest regards`,
      tone: 'neutral',
      priority: customer.priority || 'medium',
    };
  }

  const parts = extractEmailParts(latest.content, latest.emailSubject);
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey || groqKey === 'your_groq_api_key') {
    return buildTemplateReply(customer, latest, parts);
  }

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a professional CRM assistant. Draft a concise, empathetic email reply (under 150 words).
Tone must match customer sentiment: ${latest.sentimentLabel || customer.overallSentiment}.
Priority: ${latest.priority || customer.priority}.
Do not invent facts. Include a clear next step.`,
        },
        {
          role: 'user',
          content: `Customer: ${customer.name} (${customer.company || 'N/A'})
Their email subject: ${parts.subject}
Their message:
${parts.body.slice(0, 1500)}

Insight: ${latest.emailInsight || customer.emailInsight || 'Standard follow-up'}

Draft a reply email body only (no subject line).`,
        },
      ],
      max_tokens: 400,
      temperature: 0.4,
    });

    const suggestedReply = completion.choices[0]?.message?.content?.trim() || buildTemplateReply(customer, latest, parts).suggestedReply;
    return {
      suggestedReply,
      tone: latest.sentimentLabel || 'neutral',
      priority: latest.priority || customer.priority,
      basedOnSubject: parts.subject,
    };
  } catch (err) {
    console.warn('Groq suggest-reply failed:', err.message);
    return buildTemplateReply(customer, latest, parts);
  }
};

const buildTemplateReply = (customer, interaction, parts) => {
  const first = customer.name.split(' ')[0];
  const label = interaction.sentimentLabel || 'neutral';

  if (label === 'negative') {
    return {
      suggestedReply: `Hi ${first},\n\nThank you for reaching out. I'm sorry to hear about your experience regarding "${parts.subject}". I'd like to understand the issue better and work toward a resolution.\n\nCould we schedule a brief call this week? Please let me know a time that works for you.\n\nBest regards`,
      tone: 'empathetic',
      priority: interaction.priority || 'high',
      basedOnSubject: parts.subject,
    };
  }
  if (label === 'positive') {
    return {
      suggestedReply: `Hi ${first},\n\nThank you for your message — I'm glad things are going well! Regarding "${parts.subject}", I'm happy to help with any next steps.\n\nLet me know if you'd like to discuss further.\n\nBest regards`,
      tone: 'positive',
      priority: interaction.priority || 'low',
      basedOnSubject: parts.subject,
    };
  }
  return {
    suggestedReply: `Hi ${first},\n\nThank you for your email about "${parts.subject}". I've reviewed your message and will follow up with the details shortly.\n\nPlease let me know if you have any urgent questions in the meantime.\n\nBest regards`,
    tone: 'professional',
    priority: interaction.priority || 'medium',
    basedOnSubject: parts.subject,
  };
};

const getPriorityInbox = async (user) => {
  const filter = {};
  if (user.role === 'sales_manager') {
    filter.assignedTo = user._id;
  }

  const customers = await Customer.find(filter)
    .select('name email company status overallSentiment churnScore priority priorityScore emailInsight lastEmailSubject lastContactDate')
    .sort({ priorityScore: -1, churnScore: -1 })
    .limit(50);

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return customers.sort(
    (a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  );
};

module.exports = {
  analyzeEmailWithAI,
  reanalyzeCustomerEmails,
  reanalyzeAllCustomers,
  getSuggestedResponse,
  getPriorityInbox,
  updateCustomerFromInteractions,
  extractEmailParts,
};
