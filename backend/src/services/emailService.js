const nodemailer = require('nodemailer');

const isMailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransport = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async ({ to, subject, html, text }) => {
  if (!isMailConfigured()) {
    console.warn('Email skipped: SMTP_USER and SMTP_PASS are not configured');
    return { skipped: true };
  }

  const transporter = createTransport();
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `SynapseCRM <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });
};

const sendPasswordResetEmail = async (to, name, resetLink) => sendMail({
  to,
  subject: 'Reset your SynapseCRM password',
  text: `Hi ${name || 'there'}, reset your password here: ${resetLink}`,
  html: `<p>Hi ${name || 'there'},</p><p>Reset your password here: <a href="${resetLink}">${resetLink}</a></p>`,
});

const sendChurnAlert = async (to, managerName, customerName, churnScore) => sendMail({
  to,
  subject: 'High churn risk alert',
  text: `${customerName} has high churn risk (${Math.round(churnScore * 100)}%).`,
  html: `<p>Hi ${managerName || 'there'},</p><p><strong>${customerName}</strong> has high churn risk (${Math.round(churnScore * 100)}%).</p>`,
});

const sendSentimentAlert = async (to, managerName, customerName) => sendMail({
  to,
  subject: 'Negative sentiment alert',
  text: `${customerName} has three recent negative interactions.`,
  html: `<p>Hi ${managerName || 'there'},</p><p><strong>${customerName}</strong> has three recent negative interactions.</p>`,
});

module.exports = {
  isMailConfigured,
  sendMail,
  sendPasswordResetEmail,
  sendChurnAlert,
  sendSentimentAlert,
};
