const puppeteer = require('puppeteer');
const Customer = require('../models/Customer');
const Interaction = require('../models/Interaction');

exports.exportDashboardPDF = async (req, res) => {
  let browser;
  let responseSent = false;
  
  // Set a timeout to prevent hanging requests
  const timeoutHandle = setTimeout(() => {
    if (!responseSent) {
      console.error('❌ PDF export timeout after 60 seconds');
      responseSent = true;
      if (!res.headersSent) {
        res.status(503).json({ 
          success: false, 
          error: 'PDF generation timeout - request took too long' 
        });
      }
    }
  }, 60000);

  try {
    const { dateRange } = req.body;

    // Fetch dashboard data
    const totalCustomers = await Customer.countDocuments();
    const atRiskCount = await Customer.countDocuments({ churnScore: { $gt: 0.6 } });
    const recentInteractions = await Interaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name email');

    const positiveCount = await Interaction.countDocuments({ sentimentLabel: 'positive' });
    const negativeCount = await Interaction.countDocuments({ sentimentLabel: 'negative' });

    // Generate interactions table HTML
    const interactionsTableHTML = recentInteractions.map(i => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${i.customerId?.name || 'Unknown'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${i.customerId?.email || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${i.type || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${(i.content || '').substring(0, 50)}${(i.content || '').length > 50 ? '...' : ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${new Date(i.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');

    // Generate HTML for PDF - simplified and robust
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SynapseCRM Dashboard Report</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 30px; background: white; color: #1f2937;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0369a1; margin: 0 0 5px 0; font-size: 28px;">📊 SynapseCRM Dashboard Report</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
    <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; background: #f9fafb;">
      <p style="margin: 0; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Total Customers</p>
      <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #111827;">${totalCustomers}</p>
    </div>
    <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; background: #f9fafb;">
      <p style="margin: 0; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">At Risk</p>
      <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #dc2626;">${atRiskCount}</p>
    </div>
    <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; background: #f9fafb;">
      <p style="margin: 0; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Positive Sentiment</p>
      <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #16a34a;">${positiveCount}</p>
    </div>
    <div style="border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; background: #f9fafb;">
      <p style="margin: 0; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Negative Sentiment</p>
      <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #dc2626;">${negativeCount}</p>
    </div>
  </div>

  <div style="margin-top: 40px;">
    <h2 style="color: #111827; font-size: 16px; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📋 Recent Interactions</h2>
    <table style="width: 100%; border-collapse: collapse; background: white;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #d1d5db;">Customer</th>
          <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #d1d5db;">Email</th>
          <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #d1d5db;">Type</th>
          <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #d1d5db;">Content</th>
          <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #d1d5db;">Date</th>
        </tr>
      </thead>
      <tbody>
        ${interactionsTableHTML || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #9ca3af;">No recent interactions</td></tr>'}
      </tbody>
    </table>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280;">
    <p style="margin: 0;">This report was automatically generated by SynapseCRM</p>
    <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} SynapseCRM. All rights reserved.</p>
  </div>

</body>
</html>
    `;

    console.log('📄 PDF Generation Started');
    console.log(`   Data: ${totalCustomers} customers, ${atRiskCount} at-risk, ${positiveCount} positive, ${negativeCount} negative interactions`);

    // Launch browser with better configuration
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--no-first-run'
      ]
    });

    const page = await browser.newPage();
    
    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set content and wait for it to render
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    // Extra wait for rendering
    await page.waitForTimeout(1000);

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      scale: 1
    });

    await page.close();
    await browser.close();

    console.log(`✅ PDF Generated: ${pdfBuffer.length} bytes`);

    // Verify PDF buffer has content
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty - Puppeteer failed to generate PDF');
    }

    // Clear the timeout since we're sending the response
    clearTimeout(timeoutHandle);
    responseSent = true;

    // Send PDF as response using end() instead of send()
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dashboard-report-${new Date().toISOString().split('T')[0]}.pdf"`
    );
    
    res.end(pdfBuffer, 'binary');
    console.log('✅ PDF sent to client');

  } catch (error) {
    console.error('❌ PDF export error:', error.message);
    console.error('Stack:', error.stack);
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e.message);
      }
    }

    // Clear timeout and prevent double response
    clearTimeout(timeoutHandle);
    if (!responseSent && !res.headersSent) {
      responseSent = true;
      res.status(500).json({
        success: false,
        error: error.message,
        type: error.constructor.name
      });
    }
  }
};
