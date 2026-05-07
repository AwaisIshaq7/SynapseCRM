const Groq = require('groq-sdk');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// POST /api/rag/query
exports.queryCustomerData = async (req, res) => {
  try {
    const { question, customerId } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    let contextText = '';
    let customerInfo = '';

    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }

      const interactions = await Interaction.find({ customerId })
        .sort({ date: -1 })
        .limit(15)
        .populate('userId', 'name');

      customerInfo = `
Customer: ${customer.name}
Email: ${customer.email}
Company: ${customer.company || 'N/A'}
Status: ${customer.status}
Overall Sentiment: ${customer.overallSentiment}
Churn Risk Score: ${customer.churnScore}
Last Contact: ${customer.lastContactDate ? new Date(customer.lastContactDate).toDateString() : 'Unknown'}
      `.trim();

      contextText = interactions.length === 0
        ? 'No interaction history found for this customer.'
        : interactions.map((i, index) => `
Interaction ${index + 1}:
- Date: ${new Date(i.date).toDateString()}
- Type: ${i.type}
- Logged by: ${i.userId?.name || 'Unknown'}
- Content: ${i.content}
- Sentiment: ${i.sentimentLabel || 'not analyzed'} (score: ${i.sentimentScore ?? 'N/A'})
        `.trim()).join('\n\n');

    } else {
      const recentInteractions = await Interaction.find()
        .sort({ date: -1 })
        .limit(20)
        .populate('customerId', 'name company status')
        .populate('userId', 'name');

      const customers = await Customer.find()
        .select('name status churnScore overallSentiment lastContactDate')
        .sort({ churnScore: -1 })
        .limit(10);

      customerInfo = `
Top customers by churn risk:
${customers.map(c =>
  `- ${c.name}: status=${c.status}, churnScore=${c.churnScore}, sentiment=${c.overallSentiment}`
).join('\n')}
      `.trim();

      contextText = recentInteractions.map((i, index) => `
Interaction ${index + 1}:
- Customer: ${i.customerId?.name || 'Unknown'} (${i.customerId?.company || 'N/A'})
- Date: ${new Date(i.date).toDateString()}
- Type: ${i.type}
- Content: ${i.content}
- Sentiment: ${i.sentimentLabel || 'not analyzed'} (score: ${i.sentimentScore ?? 'N/A'})
      `.trim()).join('\n\n');
    }

    const systemPrompt = `You are SynapseAI, an intelligent CRM assistant for SynapseCRM.
Your job is to help sales managers and admins understand their customer relationships.

Rules:
- Only answer based on the provided customer data and interaction logs
- Be concise, professional, and actionable
- If sentiment is negative, highlight it and suggest follow-up actions
- If churn risk is high, always mention it and recommend immediate contact
- Never make up information not present in the data`;

    const userMessage = `
${customerInfo ? `CUSTOMER INFORMATION:\n${customerInfo}\n\n` : ''}
INTERACTION HISTORY:
${contextText}

---
User Question: ${question}

Answer based only on the data above.`;

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
        contextUsed: {
          interactionsRetrieved: contextText.split('Interaction').length - 1,
          customerId: customerId || null,
        },
      },
    });

  } catch (err) {
    console.error('RAG error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/rag/summarize/:customerId
exports.summarizeCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const interactions = await Interaction.find({ customerId: req.params.customerId })
      .sort({ date: -1 })
      .limit(20);

    if (interactions.length === 0) {
      return res.status(200).json({
        success: true,
        data: { summary: 'No interaction history found for this customer.' },
      });
    }

    const interactionText = interactions.map((i, index) =>
      `${index + 1}. [${new Date(i.date).toDateString()}] ${i.type.toUpperCase()}: ${i.content} (Sentiment: ${i.sentimentLabel || 'unknown'})`
    ).join('\n');

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `Summarize this customer relationship in exactly 3 clear sentences.
Focus on: overall sentiment trend, key concerns raised, and recommended next action.

Customer: ${customer.name} (${customer.company || 'N/A'})
Churn Score: ${customer.churnScore}
Status: ${customer.status}

Interaction History:
${interactionText}`,
        },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const summary = response.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: { summary, customer: customer.name },
    });

  } catch (err) {
    console.error('Summarize error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};