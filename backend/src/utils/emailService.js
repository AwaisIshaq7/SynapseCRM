const { sendMail, getMailFrom } = require('../services/emailService');

exports.sendChurnAlert = async (toEmail, managerName, customerName, churnScore) => {
  try {
    await sendMail({
      from: getMailFrom(),
      to: toEmail,
      subject: `⚠️ Churn Alert: ${customerName} is at high risk`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1d4ed8; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ SynapseCRM Alert</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px;">Hi <strong>${managerName}</strong>,</p>
            <p style="font-size: 16px;">Your customer <strong>${customerName}</strong> has been flagged as high churn risk.</p>
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #dc2626; font-weight: bold;">Churn Score: ${(churnScore * 100).toFixed(0)}%</p>
              <p style="margin: 5px 0 0; color: #7f1d1d;">Immediate action recommended</p>
            </div>
            <p style="font-size: 14px; color: #64748b;">Log in to SynapseCRM to review this customer and take action.</p>
            <a href="https://synapsecrm.vercel.app" 
               style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Open SynapseCRM
            </a>
          </div>
        </div>
      `,
    });
    console.log(`📧 Churn alert email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Churn email failed:', err.message);
    return false;
  }
};

exports.sendSentimentAlert = async (toEmail, managerName, customerName) => {
  try {
    await sendMail({
      from: getMailFrom(),
      to: toEmail,
      subject: `📉 Sentiment Alert: ${customerName} — 3 consecutive negative interactions`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📉 Sentiment Alert</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px;">Hi <strong>${managerName}</strong>,</p>
            <p style="font-size: 16px;">
              <strong>${customerName}</strong> has had 
              <span style="color: #dc2626; font-weight: bold;">3 consecutive negative interactions</span>.
            </p>
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #dc2626; font-weight: bold;">
                Status automatically changed to At Risk
              </p>
              <p style="margin: 5px 0 0; color: #7f1d1d;">
                We recommend scheduling a call immediately
              </p>
            </div>
            <a href="https://synapsecrm.vercel.app"
               style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Review Customer
            </a>
          </div>
        </div>
      `,
    });
    console.log(`📧 Sentiment alert email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Sentiment email failed:', err.message);
    return false;
  }
};