const nodemailer = require('nodemailer');

const isMailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

/** Gmail app passwords must be 16 characters with no spaces. */
const getSmtpPass = () => (process.env.SMTP_PASS || '').replace(/\s+/g, '');

const createTransport = () => {
  const user = process.env.SMTP_USER?.trim();
  const pass = getSmtpPass();

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    auth: { user, pass },
  });
};

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

/**
 * Sends reset link to `to` (any provider). Mail is sent FROM SMTP_USER in .env
 * (one Gmail app account for the whole app — not per-user Gmail).
 */
const sendVerificationEmail = async (to, name, verifyLink) => sendMail({
  to,
  subject: 'Verify your SynapseCRM email',
  text: `Hi ${name || 'there'},\n\nConfirm your email to activate your account:\n${verifyLink}\n\nLink expires in 24 hours.`,
  html: `<div style="font-family:sans-serif;max-width:520px"><h2 style="color:#2563eb">SynapseCRM</h2><p>Hi ${name || 'there'},</p><p>Verify your email to activate your account:</p><p><a href="${verifyLink}">Verify email</a></p><p style="font-size:12px;color:#64748b">${verifyLink}</p></div>`,
});

const sendPasswordResetEmail = async (to, name, resetLink) => sendMail({
  to,
  subject: 'Reset your SynapseCRM password',
  text: `Hi ${name || 'there'},\n\nReset your password using this link (expires in 1 hour):\n${resetLink}\n\nIf you did not request this, ignore this email.`,
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#2563eb">SynapseCRM</h2>
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p>
      <p style="font-size:12px;color:#64748b">Or copy this link: ${resetLink}</p>
      <p style="font-size:12px;color:#64748b">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
    </div>
  `,
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
  createTransport,
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendChurnAlert,
  sendSentimentAlert,
};

