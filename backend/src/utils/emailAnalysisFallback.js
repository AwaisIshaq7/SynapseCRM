/**
 * CRM email analysis fallback when Python AI service is offline.
 * Mirrors ai-service/src/email_intelligence.py logic.
 */

const URGENT = ['urgent', 'asap', 'complaint', 'cancel', 'refund', 'unhappy', 'frustrated', 'issue', 'problem', 'help'];
const NEGATIVE = ['unfortunately', 'disappointed', 'concern', 'delay', 'poor', 'unsatisfied', 'error', 'failed'];
const POSITIVE = ['thank', 'great', 'excellent', 'happy', 'appreciate', 'interested', 'wonderful'];
const MARKETING = ['noreply', 'no-reply', 'notifications', 'newsletter', 'linkedin', 'promo'];

const hits = (text, words) => words.filter((w) => text.includes(w));

const extractParts = (content, emailSubject) => {
  if (emailSubject) {
    const body = (content || '').replace(/^Subject:\s*.+?\n\n?/is, '').trim();
    return { subject: emailSubject, body: body || content };
  }
  const m = (content || '').match(/^Subject:\s*(.+?)(?:\n\n|\n)([\s\S]*)$/i);
  if (m) return { subject: m[1].trim(), body: m[2].trim() };
  return { subject: '', body: content || '' };
};

const analyzeEmailFallback = ({ subject = '', body = '', content, daysSinceContact = 0, churnScore = 0, emailSubject }) => {
  const parts = content ? extractParts(content, emailSubject) : { subject, body };
  const combined = `${parts.subject}\n${parts.body}`.trim().toLowerCase();

  if (!combined) {
    return { sentiment: 'neutral', score: 0, priority: 'low', priorityScore: 10, insight: 'No email content.', urgencyFlags: [] };
  }

  if (MARKETING.some((h) => combined.includes(h)) && !hits(combined, URGENT).length) {
    return {
      sentiment: 'neutral',
      score: 0,
      priority: 'low',
      priorityScore: 15,
      insight: 'Likely promotional email — low follow-up priority.',
      urgencyFlags: [],
    };
  }

  const urgentHits = hits(combined, URGENT);
  const negHits = hits(combined, NEGATIVE);
  const posHits = hits(combined, POSITIVE);

  let score = 0;
  score -= urgentHits.length * 0.12;
  score -= negHits.length * 0.08;
  score += posHits.length * 0.06;
  score = Math.max(-1, Math.min(1, Math.round(score * 100) / 100));

  let sentiment = 'neutral';
  if (score >= 0.05) sentiment = 'positive';
  if (score <= -0.05) sentiment = 'negative';

  let priorityScore = 50;
  if (sentiment === 'negative') priorityScore += 25;
  if (sentiment === 'positive') priorityScore -= 15;
  priorityScore += Math.min(urgentHits.length * 12, 36);
  priorityScore += Math.min(daysSinceContact * 0.5, 15);
  priorityScore += (churnScore || 0) * 20;
  if (score <= -0.5) priorityScore += 20;
  priorityScore = Math.max(0, Math.min(100, Math.round(priorityScore)));

  let priority = 'medium';
  if (priorityScore >= 80 || (urgentHits.length >= 2 && sentiment === 'negative')) priority = 'urgent';
  else if (priorityScore >= 60 || sentiment === 'negative') priority = 'high';
  else if (priorityScore < 35) priority = 'low';

  let insight = 'Standard follow-up.';
  if (sentiment === 'negative' && urgentHits.length) {
    insight = `Negative tone with urgency (${urgentHits.slice(0, 3).join(', ')}). Respond within 24h.`;
  } else if (sentiment === 'negative') {
    insight = 'Negative sentiment — acknowledge concerns and propose next steps.';
  } else if (sentiment === 'positive') {
    insight = 'Positive email — good time to strengthen the relationship.';
  } else if (urgentHits.length) {
    insight = `Urgency detected (${urgentHits.slice(0, 2).join(', ')}). Prioritize a timely reply.`;
  }

  return {
    sentiment,
    score,
    priority,
    priorityScore,
    insight,
    urgencyFlags: [...new Set([...urgentHits, ...negHits.slice(0, 3)])].slice(0, 5),
    breakdown: { positive: 0, neutral: 1, negative: 0 },
  };
};

module.exports = { analyzeEmailFallback, extractParts };
