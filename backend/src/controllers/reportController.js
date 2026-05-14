const puppeteer = require('puppeteer');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');

exports.exportDashboardPDF = async (req, res) => {
  try {
    const { dateRange, customDateRange } = req.body;

    // Fetch dashboard data
    const totalCustomers = await Customer.countDocuments();
    const atRiskCount = await Customer.countDocuments({ churnScore: { $gt: 0.6 } });
    const recentInteractions = await Interaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name email');

    const positiveCount = await Interaction.countDocuments({ sentimentLabel: 'positive' });
    const negativeCount = await Interaction.countDocuments({ sentimentLabel: 'negative' });

    // Generate HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            background-color: #f8fafc;
            color: #0f172a;
          }
          h1 { 
            color: #0369a1; 
            text-align: center;
            margin-bottom: 10px;
          }
          .date-info {
            text-align: center;
            color: #64748b;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .stats { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin: 30px 0; 
          }
          .stat-card { 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 20px; 
            background-color: #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .stat-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .stat-value { 
            font-size: 32px; 
            font-weight: bold; 
            color: #0f172a;
            margin: 10px 0; 
          }
          .stat-description {
            font-size: 12px;
            color: #64748b;
          }
          h2 {
            color: #0f172a;
            font-size: 18px;
            margin-top: 40px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background-color: #ffffff;
          }
          th { 
            background: #f1f5f9;
            padding: 12px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            border-bottom: 2px solid #e2e8f0;
          }
          td { 
            border: 1px solid #e2e8f0; 
            padding: 12px; 
            font-size: 13px;
            color: #475569;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <h1>📊 SynapseCRM Dashboard Report</h1>
        <div class="date-info">
          Generated on ${new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Customers</div>
            <div class="stat-value">${totalCustomers}</div>
            <div class="stat-description">Active customers in system</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">At Risk</div>
            <div class="stat-value">${atRiskCount}</div>
            <div class="stat-description">Customers with high churn score</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Positive Sentiment</div>
            <div class="stat-value">${positiveCount}</div>
            <div class="stat-description">Interactions with positive sentiment</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Negative Sentiment</div>
            <div class="stat-value">${negativeCount}</div>
            <div class="stat-description">Interactions with negative sentiment</div>
          </div>
        </div>
        
        <h2>📋 Recent Interactions (Last 10)</h2>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Type</th>
              <th>Content</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${recentInteractions.map(i => `
              <tr>
                <td>${i.customerId?.name || 'Unknown'}</td>
                <td>${i.customerId?.email || '-'}</td>
                <td>${i.type}</td>
                <td>${(i.content || '').substring(0, 50)}${(i.content || '').length > 50 ? '...' : ''}</td>
                <td>${new Date(i.createdAt).toLocaleDateString('en-US')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This report was automatically generated by SynapseCRM</p>
          <p>© ${new Date().getFullYear()} SynapseCRM. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Generate PDF using puppeteer
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
