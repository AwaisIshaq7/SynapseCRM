/**
 * Test Gmail / SMTP — run: node test-smtp.js [recipient@email.com]
 */
require('dotenv').config();
const { createTransport, isMailConfigured } = require('./src/services/emailService');

const to = process.argv[2] || process.env.SMTP_USER;

if (!isMailConfigured()) {
  console.error('❌ Set SMTP_USER and SMTP_PASS in backend/.env');
  process.exit(1);
}

const run = async () => {
  console.log('Testing SMTP...');
  console.log(`  Host: ${process.env.SMTP_HOST || '(gmail service)'}`);
  console.log(`  Port: ${process.env.SMTP_PORT || 'default'}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  To:   ${to}\n`);

  const transporter = createTransport();
  await transporter.verify();
  console.log('✅ SMTP connection verified\n');

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `SynapseCRM <${process.env.SMTP_USER}>`,
    to,
    subject: 'SynapseCRM SMTP test',
    text: 'If you received this, forgot-password email will work.',
    html: '<p>If you received this, <strong>forgot-password</strong> email will work.</p>',
  });

  console.log('✅ Test email sent:', info.messageId);
};

run().catch((err) => {
  console.error('❌ SMTP failed:', err.message);
  if (err.code === 'EAUTH') {
    console.error('\nTip: Use a Gmail App Password (16 chars, no spaces), not your normal Gmail password.');
    console.error('https://myaccount.google.com/apppasswords');
  }
  process.exit(1);
});
