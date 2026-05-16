const Groq = require('groq-sdk');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const { prepareEmbeddingText } = require('../services/vectorSearch');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function calculateRelevanceScore(interaction) {
  let score = 1.0;
  const daysSince = (Date.now() - new Date(interaction.date).getTime()) / (1000 * 60 * 60 * 24);

  score *= Math.exp(-daysSince / 30);

  if (interaction.sentimentLabel === 'negative') score *= 1.5;
  if (interaction.sentimentLabel === 'positive') score *= 0.8;

  return score;
}

async function getRelevantInteractions(customerId, limit = 20, timeRangeDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);

  const interactions = await Interaction.find({
    customerId,
    date: { $gte: cutoffDate },
  })
    .sort({ date: -1 })
    .limit(limit)
    .populate('userId', 'name');

  return interactions.map((interaction) => ({
    ...interaction.toObject(),
    relevanceScore: calculateRelevanceScore(interaction),
  }));
}

function toDaysSince(dateValue) {
  if (!dateValue) return 'Unknown';
  return Math.floor((Date.now() - new Date(dateValue).getTime()) / (1000 * 60 * 60 * 24));
}

function formatInteractionHistory(interactions) {
  if (interactions.length === 0) {
    return 'No interaction history found for this customer in the last 90 days.';
  }

  return interactions.map((interaction, index) => {
    const sentimentEmoji = interaction.sentimentLabel === 'positive'
      ? '😊'
      : interaction.sentimentLabel === 'negative'
        ? '😞'
        : '😐';

    return `
${index + 1}. [${new Date(interaction.date).toDateString()}] ${interaction.type.toUpperCase()} ${sentimentEmoji}
   By: ${interaction.userId?.name || 'Unknown'}
   Content: ${interaction.content}
   Sentiment: ${interaction.sentimentLabel || 'not analyzed'} (${Number(interaction.sentimentScore || 0).toFixed(2)})
   Relevance Score: ${interaction.relevanceScore.toFixed(3)}
    `.trim();
  }).join('\n\n');
}

function buildSystemPrompt() {
  return `You are SynapseAI, an intelligent CRM assistant for SynapseCRM.
Your job is to provide actionable insights to sales managers based on customer data.

ROLES & RESPONSIBILITIES:
1. Identify at-risk customers and suggest retention strategies
2. Analyze sentiment trends and recommend follow-up actions
3. Provide executive summaries of customer health
4. Help prioritize which customers need attention first

RESPONSE GUIDELINES:
- Always start with the most critical insight first
- Use bullet points for actionable recommendations
- If churn risk is >70%, state "URGENT: High churn risk detected"
- If sentiment has been declining, mention the trend
- Never invent information not in the provided data
- If data is insufficient, state what additional info would help

FORMATTING:
- Use **bold** for key metrics (scores, percentages)
- Use emojis sparingly for sentiment (😊/😐/😞)
- Keep responses under 500 words unless analysis requires more`;
}

function buildCustomerContext(customer, interactions, metrics) {
  return `
CUSTOMER INFORMATION:
- Name: ${customer.name}
- Email: ${customer.email}
- Company: ${customer.company || 'N/A'}
- Status: ${customer.status}
- Overall Sentiment: ${customer.overallSentiment}
- Churn Risk Score: ${(customer.churnScore * 100).toFixed(1)}%
- Last Contact: ${metrics.daysSinceLastContact} days ago
- Total Interactions (90 days): ${metrics.totalInteractions}
- Sentiment Breakdown: 👍 ${metrics.sentimentCounts.positive} | 😐 ${metrics.sentimentCounts.neutral} | 👎 ${metrics.sentimentCounts.negative}
  `.trim() + `

INTERACTION HISTORY:
${formatInteractionHistory(interactions)}`;
}

function buildGlobalContext(atRiskCustomers, recentInteractions) {
  return `
TOP AT-RISK CUSTOMERS:
${atRiskCustomers.map((customer) =>
    `- ${customer.name} (${customer.company || 'N/A'}): ${(customer.churnScore * 100).toFixed(0)}% churn risk, sentiment: ${customer.overallSentiment}`
  ).join('\n')}

RECENT INTERACTIONS SUMMARY:
Total interactions in last 30 days: ${recentInteractions.length}

INTERACTION HISTORY:
${recentInteractions.map((interaction, index) => `
${index + 1}. [${new Date(interaction.date).toDateString()}] ${interaction.customerId?.name || 'Unknown'} (${interaction.customerId?.company || 'N/A'})
   Type: ${interaction.type} | By: ${interaction.userId?.name || 'Unknown'}
   Content: ${interaction.content.substring(0, 150)}${interaction.content.length > 150 ? '...' : ''}
   Sentiment: ${interaction.sentimentLabel || 'not analyzed'}
  `.trim()).join('\n\n')}`.trim();
}

// POST /api/rag/query
exports.queryCustomerData = async (req, res) => {
  try {
    const { question, customerId } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, data: null, error: 'Question is required' });
    }

    let metrics = {};
    let customerInfo = '';
    let contextText = '';
    let vectorReadyText = '';

    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, data: null, error: 'Customer not found' });
      }

      const interactions = await getRelevantInteractions(customerId, 20, 90);
      const sentimentCounts = {
        positive: interactions.filter((interaction) => interaction.sentimentLabel === 'positive').length,
        neutral: interactions.filter((interaction) => interaction.sentimentLabel === 'neutral').length,
        negative: interactions.filter((interaction) => interaction.sentimentLabel === 'negative').length,
      };

      const avgSentimentScore = interactions.length > 0
        ? interactions.reduce((sum, interaction) => sum + Number(interaction.sentimentScore || 0), 0) / interactions.length
        : 0;

      metrics = {
        totalInteractions: interactions.length,
        sentimentCounts,
        avgSentimentScore: Number(avgSentimentScore.toFixed(2)),
        daysSinceLastContact: toDaysSince(customer.lastContactDate || interactions[0]?.date),
      };

      customerInfo = `
CUSTOMER INFORMATION:
- Name: ${customer.name}
- Email: ${customer.email}
- Company: ${customer.company || 'N/A'}
- Status: ${customer.status}
- Overall Sentiment: ${customer.overallSentiment}
- Churn Risk Score: ${(customer.churnScore * 100).toFixed(1)}%
- Last Contact: ${metrics.daysSinceLastContact} days ago
- Total Interactions (90 days): ${metrics.totalInteractions}
- Sentiment Breakdown: 👍 ${sentimentCounts.positive} | 😐 ${sentimentCounts.neutral} | 👎 ${sentimentCounts.negative}
      `.trim();

      contextText = formatInteractionHistory(interactions);
      vectorReadyText = prepareEmbeddingText(customer, interactions);
    } else {
      const atRiskCustomers = await Customer.find({ churnScore: { $gte: 0.6 } })
        .select('name company churnScore overallSentiment status')
        .sort({ churnScore: -1 })
        .limit(10);

      const recentCutoff = new Date();
      recentCutoff.setDate(recentCutoff.getDate() - 30);

      const recentInteractions = await Interaction.find({ date: { $gte: recentCutoff } })
        .sort({ date: -1 })
        .limit(15)
        .populate('customerId', 'name company status')
        .populate('userId', 'name');

      customerInfo = `
TOP AT-RISK CUSTOMERS:
${atRiskCustomers.map((customer) =>
  `- ${customer.name} (${customer.company || 'N/A'}): ${(customer.churnScore * 100).toFixed(0)}% churn risk, sentiment: ${customer.overallSentiment}`
).join('\n')}

RECENT INTERACTIONS SUMMARY:
Total interactions in last 30 days: ${recentInteractions.length}
      `.trim();

      contextText = buildGlobalContext(atRiskCustomers, recentInteractions);
      vectorReadyText = contextText;

      metrics = {
        totalInteractions: recentInteractions.length,
        avgSentimentScore: 0,
        daysSinceLastContact: 'Unknown',
        sentimentCounts: {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
      };
    }

    const systemPrompt = buildSystemPrompt();
    const userMessage = `
${customerInfo ? `📋 ${customerInfo}\n\n` : ''}
${metrics.totalInteractions ? `📊 METRICS:
- Total Interactions: ${metrics.totalInteractions}
- Avg Sentiment Score: ${metrics.avgSentimentScore}
- Days Since Last Contact: ${metrics.daysSinceLastContact}
\n` : ''}
${contextText ? `📝 INTERACTION HISTORY:
${contextText}\n\n` : ''}
---
❓ USER QUESTION: ${question}

Based ONLY on the data above, provide a concise, actionable answer.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const answer = response.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        metrics,
        contextUsed: {
          interactionsRetrieved: customerId ? metrics.totalInteractions : Math.min(15, metrics.totalInteractions),
          customerId: customerId || null,
          vectorSearchReady: Boolean(vectorReadyText),
        },
      },
      error: null,
    });
  } catch (err) {
    console.error('RAG error:', err.message);
    res.status(500).json({ success: false, data: null, error: err.message });
  }
};

// POST /api/rag/summarize/:customerId
exports.summarizeCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, data: null, error: 'Customer not found' });
    }

    const interactions = await getRelevantInteractions(req.params.customerId, 20, 90);

    if (interactions.length === 0) {
      return res.status(200).json({
        success: true,
        data: { summary: 'No interaction history found for this customer.', customer: customer.name },
        error: null,
      });
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Summarize the customer relationship using only the provided CRM data. Keep it concise, actionable, and grounded in the evidence.',
        },
        {
          role: 'user',
          content: `Summarize this customer relationship in exactly 3 clear sentences.
Focus on: overall sentiment trend, key concerns raised, and recommended next action.

Customer: ${customer.name} (${customer.company || 'N/A'})
Churn Score: ${(customer.churnScore * 100).toFixed(1)}%
Status: ${customer.status}
Last Contact: ${toDaysSince(customer.lastContactDate || interactions[0]?.date)} days ago

Interaction History:
${formatInteractionHistory(interactions)}`,
        },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const summary = response.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: { summary, customer: customer.name, interactionsReviewed: interactions.length },
      error: null,
    });
  } catch (err) {
    console.error('Summarize error:', err.message);
    res.status(500).json({ success: false, data: null, error: err.message });
  }
};

exports.getRelevantInteractions = getRelevantInteractions;
exports.calculateRelevanceScore = calculateRelevanceScore;