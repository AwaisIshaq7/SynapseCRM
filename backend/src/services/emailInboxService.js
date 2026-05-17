const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const getImapAuth = () => ({
  user: (process.env.IMAP_USER || process.env.SMTP_USER || '').trim(),
  pass: (process.env.IMAP_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, ''),
});

const isImapConfigured = () => {
  const { user, pass } = getImapAuth();
  return Boolean(user && pass);
};

const SKIP_SENDER_PATTERNS = [
  /^no-?reply@/i,
  /^mailer-daemon@/i,
  /^postmaster@/i,
  /^notifications?@/i,
  /^donotreply@/i,
];

const SKIP_SUBJECT_PATTERNS = [
  /verify your synapsecrm email/i,
  /reset your synapsecrm password/i,
  /synapsecrm.*verification/i,
  /delivery status notification/i,
  /out of office/i,
];

const shouldSkipMessage = (fromEmail, subject, ownerEmail) => {
  if (!fromEmail) return true;
  const email = fromEmail.toLowerCase();
  if (ownerEmail && email === ownerEmail.toLowerCase()) return true;
  if (SKIP_SENDER_PATTERNS.some((re) => re.test(email))) return true;
  if (subject && SKIP_SUBJECT_PATTERNS.some((re) => re.test(subject))) return true;
  return false;
};

/**
 * Fetch recent inbox messages via IMAP (Gmail by default).
 */
const fetchInboxEmails = async ({ limit = 50, sinceDays = 30, mailbox = 'INBOX' } = {}) => {
  if (!isImapConfigured()) {
    throw new Error('IMAP is not configured. Set SMTP_USER and SMTP_PASS (Gmail app password) in backend/.env');
  }

  const { user, pass } = getImapAuth();
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: Number(process.env.IMAP_PORT) || 993,
    secure: process.env.IMAP_SECURE !== 'false',
    auth: { user, pass },
    logger: false,
  });

  const ownerEmail = user.toLowerCase();
  const emails = [];

  await client.connect();

  try {
    const lock = await client.getMailboxLock(mailbox);
    try {
      const since = new Date();
      since.setDate(since.getDate() - sinceDays);

      const uids = await client.search({ since }, { uid: true });
      const sorted = [...uids].sort((a, b) => a - b);
      const recentUids = sorted.slice(-limit);

      if (recentUids.length === 0) {
        return [];
      }

      const uidRange = `${recentUids[0]}:${recentUids[recentUids.length - 1]}`;
      for await (const msg of client.fetch(uidRange, { envelope: true, source: true }, { uid: true })) {
        try {
          const parsed = await simpleParser(msg.source);
          const from = parsed.from?.value?.[0] || {};
          const fromEmail = (from.address || '').toLowerCase();
          const subject = parsed.subject || msg.envelope?.subject || '(no subject)';

          if (shouldSkipMessage(fromEmail, subject, ownerEmail)) continue;

          const text =
            (parsed.text || '').trim() ||
            (parsed.html ? parsed.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');

          emails.push({
            uid: msg.uid,
            messageId: parsed.messageId || `imap-${mailbox}-${msg.uid}`,
            fromName: from.name || fromEmail.split('@')[0],
            fromEmail,
            subject,
            text: text.slice(0, 50000),
            html: (parsed.html || '').slice(0, 100000),
            date: parsed.date || msg.envelope?.date || new Date(),
          });
        } catch (parseErr) {
          console.warn('⚠️ Skipped email parse error:', parseErr.message);
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return emails.sort((a, b) => new Date(b.date) - new Date(a.date));
};

module.exports = {
  isImapConfigured,
  fetchInboxEmails,
  shouldSkipMessage,
};
