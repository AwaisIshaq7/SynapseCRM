const Groq = require('groq-sdk');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const { prepareEmbeddingText } = require('./vectorSearch');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateDailyRiskReport() {
  console.log('🔄 Generating daily RAG risk report...');

  const atRiskCustomers = await Customer.find({ churnScore: { $gte: 0.6 } })
    .sort({ churnScore: -1 })
    .limit(20);

  const insights = [];

  for (const customer of atRiskCustomers) {
    const interactions = await Interaction.find({ customerId: customer._id })
      .sort({ date: -1 })
      .limit(10)
      .populate('userId', 'name');

    if (interactions.length === 0) continue;

    const prompt = `
Customer: ${customer.name}
Churn Score: ${(customer.churnScore * 100).toFixed(0)}%
Status: ${customer.status}
Overall Sentiment: ${customer.overallSentiment}

Last 10 Interactions:
${interactions.map((interaction) => `- ${new Date(interaction.date).toDateString()}: ${interaction.content.substring(0, 100)}`).join('\n')}

Generate a ONE-SENTENCE actionable insight for this customer.`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.2,
      });

      insights.push({
        customerId: customer._id,
        customerName: customer.name,
        insight: response.choices[0].message.content,
        churnScore: customer.churnScore,
        embeddingText: prepareEmbeddingText(customer, interactions),
      });
    } catch (err) {
      console.error(`Failed to generate insight for ${customer.name}:`, err.message);
    }
  }

  return insights;
}

async function bulkSummarizeCustomers(customerIds = []) {
  const summaries = [];

  for (const customerId of customerIds) {
    const customer = await Customer.findById(customerId);
    if (!customer) continue;

    const interactions = await Interaction.find({ customerId })
      .sort({ date: -1 })
      .limit(15)
      .populate('userId', 'name');

    const interactionText = interactions.map((interaction) =>
      `${new Date(interaction.date).toDateString()}: ${interaction.content.substring(0, 180)} (${interaction.sentimentLabel || 'neutral'})`
    ).join('\n');

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Summarize this customer in 2-3 sentences focusing on risk level and recommended action.

Customer: ${customer.name}
Churn Score: ${(customer.churnScore * 100).toFixed(0)}%

Interactions:
${interactionText}`,
        }],
        max_tokens: 200,
      });

      summaries.push({
        id: customer._id,
        name: customer.name,
        summary: response.choices[0].message.content,
      });
    } catch (err) {
      console.error(`Failed to summarize ${customer.name}:`, err.message);
    }
  }

  return summaries;
}

module.exports = { generateDailyRiskReport, bulkSummarizeCustomers };