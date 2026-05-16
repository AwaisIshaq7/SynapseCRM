const nodemailer = require('nodemailer');

const mailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const mailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

let mailTransporter = null;

function getMailTransport() {
  if (!mailUser || !mailPass) {
    return null;
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });
  }

  return mailTransporter;
}

function isMailConfigured() {
  return Boolean(mailUser && mailPass);
}

function shouldExposeResetArtifacts() {
  return process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG_RESET_LINK === 'true';
}

function getMailFrom() {
  return process.env.EMAIL_FROM
    || process.env.SMTP_FROM
    || process.env.SMTP_USER
    || process.env.EMAIL_USER
    || 'SynapseCRM <no-reply@synapsecrm.local>';
}

async function sendMail(message) {
  const transport = getMailTransport();

  if (!transport) {
    throw new Error('Gmail SMTP is not configured. Set SMTP_USER and SMTP_PASS before sending mail in production.');
  }

  return transport.sendMail(message);
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
  const subject = 'Reset your SynapseCRM password';
  const greetingName = name || 'there';
  const text = [
    `Hi ${greetingName},`,
    '',
    'We received a request to reset your SynapseCRM password.',
    `Use this link to reset it: ${resetLink}`,
    '',
    'This link expires in 15 minutes.',
    '',
    'If you did not request this reset, you can ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 16px;">Reset your SynapseCRM password</h2>
      <p>Hi ${greetingName},</p>
      <p>We received a request to reset your SynapseCRM password.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;">
          Reset password
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this reset, you can ignore this email.</p>
    </div>
  `;

  const configured = isMailConfigured();

  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Gmail SMTP is not configured. Set SMTP_USER and SMTP_PASS before using password reset in production.');
    }

    console.warn('⚠️ SMTP is not configured. Password reset email was not sent.');
    console.log(`Reset link for ${to}: ${resetLink}`);
    return { sent: false, mode: 'console', provider: 'gmail' };
  }

  if (process.env.NODE_ENV === 'test') {
    return { sent: false, mode: 'console', provider: 'gmail' };
  }

  await sendMail({
    from: getMailFrom(),
    to,
    subject,
    text,
    html,
  });

  return { sent: true, mode: 'gmail', provider: 'gmail' };
}

module.exports = {
  sendMail,
  sendPasswordResetEmail,
  isMailConfigured,
  shouldExposeResetArtifacts,
  getMailFrom,
};