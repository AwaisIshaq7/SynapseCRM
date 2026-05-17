const nodemailer = require('nodemailer');

const isMailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const getSmtpPass = () => (process.env.SMTP_PASS || '').replace(/\s+/g, '');

const createTransport = () => {
  const user = process.env.SMTP_USER?.trim();
  const pass = getSmtpPass();

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    return nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure, auth: { user, pass } });
  }

  return nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    auth: { user, pass },
  });
};

const sendMail = async ({ to, subject, html, text, headers }) => {
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
    headers,
  });
};

const sendVerificationEmail = async (to, name, verifyLink) => sendMail({
  to,
  subject: 'Verify your SynapseCRM email',
  text: `Hi ${name || 'there'},\n\nConfirm your email:\n${verifyLink}`,
  html: `<div style="font-family:sans-serif"><h2>SynapseCRM</h2><p>Hi ${name || 'there'},</p><p><a href="${verifyLink}">Verify email</a></p></div>`,
});

const sendPasswordResetEmail = async (to, name, resetLink) => sendMail({
  to,
  subject: 'Reset your SynapseCRM password',
  text: `Reset your password:\n${resetLink}`,
  html: `<div style="font-family:sans-serif"><p><a href="${resetLink}">Reset password</a></p></div>`,
});

const sendChurnAlert = async (to, managerName, customerName, churnScore) => sendMail({
  to,
  subject: 'High churn risk alert',
  text: `${customerName} has high churn risk (${Math.round(churnScore * 100)}%).`,
  html: `<p><strong>${customerName}</strong> has high churn risk.</p>`,
});

const sendSentimentAlert = async (to, managerName, customerName) => sendMail({
  to,
  subject: 'Negative sentiment alert',
  text: `${customerName} has three recent negative interactions.`,
  html: `<p><strong>${customerName}</strong> has three recent negative interactions.</p>`,
});

const sendCustomerReplyEmail = async ({ to, subject, body, inReplyTo }) => {
  const safeSubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Your message'}`;
  const html = `<div style="font-family:sans-serif;max-width:640px;line-height:1.6"><p>${body.replace(/\n/g, '<br>')}</p><p style="font-size:12px;color:#64748b">— Sent via SynapseCRM</p></div>`;
  const headers = {};
  if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
  return sendMail({ to, subject: safeSubject, text: body, html, headers });
};

module.exports = {
  isMailConfigured,
  createTransport,
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendChurnAlert,
  sendSentimentAlert,
  sendCustomerReplyEmail,
};
