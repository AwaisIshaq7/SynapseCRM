const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');
const { Parser } = require('json2csv');

// GET /api/reports/customers/csv
exports.exportCustomersCSV = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'sales_manager') {
      filter.assignedTo = req.user._id;
    }

    const customers = await Customer.find(filter)
      .populate('assignedTo', 'name')
      .lean();

    const data = customers.map(c => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone || '',
      Company: c.company || '',
      Status: c.status,
      'Churn Score': c.churnScore,
      'Overall Sentiment': c.overallSentiment,
      'Assigned To': c.assignedTo?.name || '',
      'Last Contact': c.lastContactDate ? new Date(c.lastContactDate).toDateString() : '',
      'Created At': new Date(c.createdAt).toDateString(),
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reports/customers/report
exports.exportCustomersReport = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'sales_manager') {
      filter.assignedTo = req.user._id;
    }

    const customers = await Customer.find(filter)
      .populate('assignedTo', 'name')
      .lean();

    const rows = customers.map((c, index) => `
      <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td>${c.name || ''}</td>
        <td>${c.email || ''}</td>
        <td>${c.phone || ''}</td>
        <td>${c.company || ''}</td>
        <td><span class="status-pill status-${String(c.status || '').replace(/_/g, '-').toLowerCase()}">${c.status || ''}</span></td>
        <td>${typeof c.churnScore === 'number' ? `${(c.churnScore * 100).toFixed(0)}%` : ''}</td>
        <td>${c.overallSentiment || ''}</td>
        <td>${c.assignedTo?.name || ''}</td>
        <td>${c.lastContactDate ? new Date(c.lastContactDate).toDateString() : ''}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SynapseCRM Customer Report</title>
  <style>
    :root {
      color-scheme: light;
    }
    body {
      margin: 0;
      padding: 28px;
      font-family: Inter, Segoe UI, Tahoma, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
    }
    .sheet {
      max-width: 1200px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
    }
    .header {
      padding: 28px 32px 18px;
      background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
      color: #fff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .header p {
      margin: 8px 0 0;
      opacity: 0.9;
      font-size: 13px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      padding: 18px 32px 0;
    }
    .stat {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 16px;
    }
    .stat .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      font-weight: 700;
    }
    .stat .value {
      font-size: 24px;
      font-weight: 800;
      margin-top: 6px;
      color: #0f172a;
    }
    .content {
      padding: 22px 32px 32px;
    }
    .table-wrap {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1100px;
      background: #fff;
    }
    thead th {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #fff;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 800;
      padding: 14px 14px;
      white-space: nowrap;
    }
    tbody td {
      padding: 12px 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #0f172a;
      vertical-align: top;
    }
    tbody tr.row-even { background: #ffffff; }
    tbody tr.row-odd { background: #f8fafc; }
    tbody tr:hover { background: #eef6ff; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: capitalize;
      white-space: nowrap;
    }
    .status-active { background: #dcfce7; color: #166534; }
    .status-at-risk { background: #fee2e2; color: #b91c1c; }
    .status-inactive { background: #e2e8f0; color: #334155; }
    .footer {
      padding: 0 32px 26px;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; border-radius: 0; border: none; }
      .table-wrap { overflow: visible; }
      thead th { position: static; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <h1>SynapseCRM Customer Report</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    <div class="stats">
      <div class="stat"><div class="label">Total Customers</div><div class="value">${customers.length}</div></div>
      <div class="stat"><div class="label">At Risk</div><div class="value">${customers.filter(c => c.status === 'at_risk').length}</div></div>
      <div class="stat"><div class="label">Active</div><div class="value">${customers.filter(c => c.status === 'active').length}</div></div>
      <div class="stat"><div class="label">Inactive</div><div class="value">${customers.filter(c => c.status === 'inactive').length}</div></div>
    </div>
    <div class="content">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Status</th>
              <th>Churn Score</th>
              <th>Sentiment</th>
              <th>Assigned To</th>
              <th>Last Contact</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="9" style="padding:20px;text-align:center;color:#94a3b8;">No customers available</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">This report is filtered to the signed-in user when the role is sales_manager.</div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=customers-report.html');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reports/interactions/csv
exports.exportInteractionsCSV = async (req, res) => {
  try {
    let customerFilter = {};
    if (req.user.role === 'sales_manager') {
      const myCustomers = await Customer.find({ assignedTo: req.user._id }).select('_id');
      customerFilter = { customerId: { $in: myCustomers.map(c => c._id) } };
    }

    const interactions = await Interaction.find(customerFilter)
      .populate('customerId', 'name company')
      .populate('userId', 'name')
      .lean();

    const data = interactions.map(i => ({
      Customer: i.customerId?.name || '',
      Company: i.customerId?.company || '',
      Type: i.type,
      Content: i.content,
      Sentiment: i.sentimentLabel || 'pending',
      'Sentiment Score': i.sentimentScore ?? '',
      'Logged By': i.userId?.name || '',
      Date: new Date(i.date).toDateString(),
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=interactions.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/reports/summary
exports.getReportSummary = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'sales_manager') {
      filter.assignedTo = req.user._id;
    }

    const customers = await Customer.find(filter);
    const total = customers.length;
    const atRisk = customers.filter(c => c.status === 'at_risk').length;
    const active = customers.filter(c => c.status === 'active').length;
    const inactive = customers.filter(c => c.status === 'inactive').length;
    const positive = customers.filter(c => c.overallSentiment === 'positive').length;
    const negative = customers.filter(c => c.overallSentiment === 'negative').length;
    const neutral = customers.filter(c => c.overallSentiment === 'neutral').length;
    const avgChurn = total
      ? (customers.reduce((s, c) => s + c.churnScore, 0) / total).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        total, atRisk, active, inactive,
        sentiment: { positive, negative, neutral },
        avgChurnScore: parseFloat(avgChurn),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
