const Groq = require('groq-sdk');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const User = require('../models/User');
const { prepareEmbeddingText, searchSimilar } = require('../services/vectorSearch');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let groqClient = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return groqClient;
}

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
Your job is to provide actionable insights and concrete communication strategies to sales managers based on customer data.

ROLES & RESPONSIBILITIES:
1. Identify at-risk customers and suggest retention strategies.
2. Analyze sentiment trends and recommend follow-up actions.
3. Provide concrete recommended reply options (e.g., copy-pasteable email drafts or talking points) that the manager can send to the customer.
4. Suggest a step-by-step approach for continued engagement (e.g. direct calls, escalation to high-touch support, or offering loyalty discount structures).
5. Help prioritize which customers need attention first.

RESPONSE GUIDELINES:
- Always start with the most critical insight first.
- Use bullet points for actionable approach recommendations.
- When answering or proposing strategies, include a customized, professional draft under a "📧 RECOMMENDED REPLY DRAFT" section.
- Tailor the draft's tone to match customer sentiment (highly empathetic/apologetic for negative sentiment, enthusiastic/upselling for positive sentiment).
- If churn risk is >70%, state "URGENT: High churn risk detected".
- Never invent information not present in the provided context.

FORMATTING:
- Use **bold** for key metrics, scores, or dates.
- Structure responses into clear sections: "📊 ANALYSIS & INSIGHTS", "🚀 STRATEGIC APPROACH", and "📧 RECOMMENDED REPLY DRAFT".
- Keep replies clean, organized, and under 500 words.`;
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
    const groq = getGroqClient();

    if (!question) {
      return res.status(400).json({ success: false, data: null, error: 'Question is required' });
    }

    if (!groq) {
      return res.status(503).json({ success: false, data: null, error: 'AI assistant is not configured' });
    }

    // ⭐ GENERATIVE RAG PDF REPORT BUILDER INTERCEPTOR ⭐
    const isPdfReportRequest = /(generate\s*(a)?\s*report|pdf\s*report)/i.test(question);
    if (isPdfReportRequest) {
      console.log('📄 Generative RAG PDF Report requested:', question);
      
      // 1. Identify which Sales Manager is requested
      let manager = null;
      const sarahMatch = /sarah/i.test(question);
      if (sarahMatch) {
        manager = await User.findOne({ name: /Sarah/i, role: 'sales_manager' });
      } else {
        // Fallback search to check if any other sales manager is mentioned
        const managers = await User.find({ role: 'sales_manager' });
        for (const m of managers) {
          const firstWord = m.name.split(' ')[0];
          if (firstWord && firstWord.length > 2) {
            const nameRegex = new RegExp(firstWord, 'i');
            if (nameRegex.test(question)) {
              manager = m;
              break;
            }
          }
        }
      }

      // 2. Fetch appropriate customer list and timelines
      let customers = [];
      let reportTitle = 'Executive Global CRM Performance & Churn Analysis';
      let scopeLabel = 'Global Platform Portfolio';

      if (manager) {
        customers = await Customer.find({ assignedTo: manager._id }).populate('assignedTo');
        reportTitle = `Executive Performance Report - ${manager.name}`;
        scopeLabel = `Sales Manager Portfolio: ${manager.name}`;
      } else {
        // If logged-in user is manager, default to their assigned customers
        if (req.user.role === 'sales_manager') {
          customers = await Customer.find({ assignedTo: req.user._id }).populate('assignedTo');
          reportTitle = `Executive Performance Report - ${req.user.name}`;
          scopeLabel = `Sales Manager Portfolio: ${req.user.name}`;
        } else {
          customers = await Customer.find({}).populate('assignedTo');
        }
      }

      // 3. Compute metrics
      const totalAccounts = customers.length;
      const atRiskAccounts = customers.filter(c => c.churnScore >= 0.7).length;
      const warningAccounts = customers.filter(c => c.churnScore >= 0.3 && c.churnScore < 0.7).length;
      const avgChurn = customers.length > 0 
        ? (customers.reduce((sum, c) => sum + c.churnScore, 0) / customers.length) * 100 
        : 0;

      const customerIds = customers.map(c => c._id);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const interactions = await Interaction.find({
        customerId: { $in: customerIds },
        date: { $gte: cutoffDate }
      }).limit(100);

      const callsCount = interactions.filter(i => i.type === 'call').length;
      const meetingsCount = interactions.filter(i => i.type === 'meeting').length;
      const notesCount = interactions.filter(i => i.type === 'note').length;

      const atRiskList = customers.filter(c => c.churnScore >= 0.7).slice(0, 5);

      // 4. Synthesize summary from Groq Llama-3.3
      const llmPrompt = `You are a high-level CRM executive. Analyze these portfolio statistics:
Scope: ${scopeLabel}
Total Customers: ${totalAccounts}
High Risk Churn Customers (>=70% risk): ${atRiskAccounts}
Warning Risk Customers (30%-69% risk): ${warningAccounts}
Average Portfolio Churn Score: ${avgChurn.toFixed(1)}%
Recent Logs: ${callsCount} calls, ${meetingsCount} meetings, and ${notesCount} notes.

Top At-Risk Customer Listing:
${atRiskList.map(c => `- ${c.name} (${c.company || 'N/A'}): ${(c.churnScore * 100).toFixed(0)}% risk, sentiment: ${c.overallSentiment}`).join('\n')}

Draft an elegant, professional, executive-ready CRM analysis report (about 180 words). Explain the risk metrics, pinpoint key concerns, and suggest 3 high-impact strategic recommendations to secure these at-risk accounts. Keep the tone completely authoritative and analytical. Do not write markdown tags.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: llmPrompt }],
        max_tokens: 600,
        temperature: 0.3
      });
      const summaryText = response.choices[0].message.content;

      // 5. Generate beautiful print HTML
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${reportTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
    body {
      font-family: 'Outfit', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      background: #ffffff;
      font-size: 14px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title-area h1 {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .title-area p {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin: 5px 0 0 0;
    }
    .meta-area {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .meta-area strong {
      color: #0f172a;
    }
    .grid {
      display: grid;
      grid-template-cols: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 35px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      background: #f8fafc;
      text-align: center;
    }
    .card-val {
      font-size: 24px;
      font-weight: 800;
      color: #2563eb;
    }
    .card-lbl {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
      font-weight: 600;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 18px;
      margin-top: 30px;
    }
    .summary-box {
      background: #eff6ff;
      border-left: 5px solid #2563eb;
      padding: 22px;
      border-radius: 8px;
      font-size: 13.5px;
      line-height: 1.6;
      color: #1e293b;
      margin-bottom: 35px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
    }
    .table th, .table td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .table th {
      background: #f1f5f9;
      font-weight: 600;
      color: #475569;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-high {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-med {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-low {
      background: #d1fae5;
      color: #065f46;
    }
    .footer {
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      margin-top: 50px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-area">
      <h1>${reportTitle}</h1>
      <p>SynapseAI executive intelligence report</p>
    </div>
    <div class="meta-area">
      Report Scope: <strong>${scopeLabel}</strong><br/>
      Generated On: <strong>${new Date().toDateString()}</strong>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-val">${totalAccounts}</div>
      <div class="card-lbl">Total Customer Accounts</div>
    </div>
    <div class="card">
      <div class="card-val" style="color: #ef4444;">${atRiskAccounts}</div>
      <div class="card-lbl">High Churn Risk Accounts</div>
    </div>
    <div class="card">
      <div class="card-val" style="color: #f59e0b;">${warningAccounts}</div>
      <div class="card-lbl">Warning Risk Accounts</div>
    </div>
    <div class="card">
      <div class="card-val" style="color: #10b981;">${avgChurn.toFixed(1)}%</div>
      <div class="card-lbl">Avg Churn Risk</div>
    </div>
  </div>

  <div class="section-title">📊 Executive Summary Analysis</div>
  <div class="summary-box">
    ${summaryText.replace(/\n/g, '<br/>')}
  </div>

  <div class="section-title">⚠️ Priority Risk Portfolio</div>
  <table class="table">
    <thead>
      <tr>
        <th>Customer Name</th>
        <th>Company</th>
        <th>Status</th>
        <th>Churn Score</th>
        <th>Sentiment Trend</th>
      </tr>
    </thead>
    <tbody>
      ${customers.length === 0 
        ? '<tr><td colspan="5" style="text-align: center;">No portfolio accounts matched.</td></tr>' 
        : customers.slice(0, 8).map(c => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.company || 'N/A'}</td>
            <td>
              <span class="badge ${c.status === 'at_risk' ? 'badge-high' : c.status === 'inactive' ? 'badge-high' : 'badge-low'}">
                ${c.status}
              </span>
            </td>
            <td>
              <strong style="color: ${c.churnScore >= 0.7 ? '#ef4444' : c.churnScore >= 0.3 ? '#f59e0b' : '#10b981'};">
                ${(c.churnScore * 100).toFixed(0)}%
              </strong>
            </td>
            <td>${c.overallSentiment}</td>
          </tr>
        `).join('')}
    </tbody>
  </table>

  <div class="footer">
    SynapseCRM Enterprise Analytics • Confidential Platform Summary Report • Powered by SynapseAI
  </div>
</body>
</html>
`;

      let downloadUrl = null;
      let reportCreated = false;

      // 6. Print using Puppeteer
      try {
        const publicDir = path.join(__dirname, '..', '..', 'public', 'reports');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }

        const filename = `report_${Date.now()}.pdf`;
        const filepath = path.join(publicDir, filename);

        const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        await page.pdf({
          path: filepath,
          format: 'A4',
          printBackground: true,
          margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
        });
        await browser.close();

        // Dynamically compute the absolute host-relative URL
        const host = req.get('host');
        const protocol = req.protocol;
        downloadUrl = `${protocol}://${host}/reports/${filename}`;
        reportCreated = true;
        console.log('✅ Generated PDF successfully. Hosted at:', downloadUrl);
      } catch (pdfErr) {
        console.warn('⚠️ Headless Puppeteer print failed (restricted container sandbox). Serving standard RAG response:', pdfErr.message);
      }

      // Return the completed Generative Report response payload!
      return res.status(200).json({
        success: true,
        data: {
          question,
          answer: `### 📄 ${reportTitle}\n\n**Scope**: ${scopeLabel}\n\n${summaryText}\n\n${downloadUrl ? `*Your executive PDF has been generated and is ready to download!*` : `*Note: PDF compilation was offline, but metrics summaries are fully accessible above.*`}`,
          metrics: {
            totalInteractions: callsCount + meetingsCount + notesCount,
            avgSentimentScore: avgChurn,
            daysSinceLastContact: 0
          },
          contextUsed: {
            interactionsRetrieved: interactions.length,
            customerId: null,
            vectorSearchReady: true,
            pdfReport: {
              created: reportCreated,
              downloadUrl,
              title: reportTitle,
              scope: scopeLabel,
              stats: {
                total: totalAccounts,
                atRisk: atRiskAccounts,
                warning: warningAccounts,
                avgChurn: avgChurn
              }
            }
          }
        },
        error: null
      });
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

      // Enforce sales_manager can only query their assigned customers
      if (req.user.role === 'sales_manager') {
        const assignedTo = customer.assignedTo ? customer.assignedTo.toString() : null;
        if (assignedTo !== req.user._id.toString()) {
          return res.status(403).json({ success: false, data: null, error: 'Access denied' });
        }
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
      let atRiskFilter = { churnScore: { $gte: 0.6 } };
      let scopedCustomerIds = null;

      // If sales_manager, restrict to their assigned customers
      if (req.user.role === 'sales_manager') {
        const myCustomers = await Customer.find({ assignedTo: req.user._id }).select('_id');
        scopedCustomerIds = myCustomers.map(c => c._id);
        atRiskFilter.assignedTo = req.user._id;
      }

      const atRiskCustomers = await Customer.find(atRiskFilter)
        .select('name company churnScore overallSentiment status')
        .sort({ churnScore: -1 })
        .limit(10);

      // Perform real semantic similarity search across all relevant customer interactions
      const recentInteractions = await searchSimilar(question, 15, scopedCustomerIds);

      customerInfo = `
TOP AT-RISK CUSTOMERS:
${atRiskCustomers.map((customer) =>
  `- ${customer.name} (${customer.company || 'N/A'}): ${(customer.churnScore * 100).toFixed(0)}% churn risk, sentiment: ${customer.overallSentiment}`
).join('\n')}

RECENT INTERACTIONS MATCHING INQUIRY:
Found ${recentInteractions.length} semantically relevant interactions.
      `.trim();

      contextText = buildGlobalContext(atRiskCustomers, recentInteractions);
      vectorReadyText = contextText;

      metrics = {
        totalInteractions: recentInteractions.length,
        avgSentimentScore: recentInteractions.length > 0
          ? Number((recentInteractions.reduce((sum, item) => sum + Number(item.sentimentScore || 0), 0) / recentInteractions.length).toFixed(2))
          : 0,
        daysSinceLastContact: 'Unknown',
        sentimentCounts: {
          positive: recentInteractions.filter(item => item.sentimentLabel === 'positive').length,
          neutral: recentInteractions.filter(item => item.sentimentLabel === 'neutral').length,
          negative: recentInteractions.filter(item => item.sentimentLabel === 'negative').length,
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
    const groq = getGroqClient();
    if (!groq) {
      return res.status(503).json({ success: false, data: null, error: 'AI assistant is not configured' });
    }

    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, data: null, error: 'Customer not found' });
    }
    // Enforce sales_manager can only summarize their assigned customers
    if (req.user.role === 'sales_manager') {
      const assignedTo = customer.assignedTo ? customer.assignedTo.toString() : null;
      if (assignedTo !== req.user._id.toString()) {
        return res.status(403).json({ success: false, data: null, error: 'Access denied' });
      }
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
