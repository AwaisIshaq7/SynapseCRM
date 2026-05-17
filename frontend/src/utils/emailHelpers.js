const URL_PATTERN = /https?:\/\/[^\s\]\)<>"]+/gi
const BRACKET_LINK = /\[(?:https?:\/\/|www\.)[^\]]*\]/gi

const FOOTER_LINE =
  /^(?:questions\?|unsubscribe|terms of use|privacy|help center|this message was mailed|src:|netflix pte|linkedin|view this email|email preferences|registered in|unlimited company|wilmington|all rights reserved|you are receiving|intended for|©|\d{4}\s|get the new linkedin)/i

const TAIL_CUT_PATTERNS = [
  /linkedin\s+ireland/i,
  /linkedin\s+corporation/i,
  /this email was intended for/i,
  /you are receiving .+ email/i,
  /update your email preferences/i,
  /unsubscribe[\s\S]*$/i,
  /©\s*\d{4}/i,
  /registered in[\s\S]*$/i,
  /wilmington[\s\S]*$/i,
  /get the new linkedin app/i,
]

/** Strip tracking URLs, footers, and legal boilerplate from plain-text email bodies. */
export function cleanEmailBody(text) {
  if (!text?.trim()) return ''

  let cleaned = text
    .replace(BRACKET_LINK, '')
    .replace(URL_PATTERN, '')
    .replace(/<\s*https?:[^>]+>/gi, '')

  for (const re of TAIL_CUT_PATTERNS) {
    const match = cleaned.match(re)
    if (match && match.index > 60) {
      cleaned = cleaned.slice(0, match.index).trim()
    }
  }

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false
      if (FOOTER_LINE.test(line)) return false
      if (/^[\s|·•\-_=]+$/.test(line)) return false
      if (line.length < 3) return false
      return true
    })

  cleaned = lines.join('\n').replace(/[^\S\n]{2,}/g, ' ').trim()

  return cleaned
}

export function getEmailBody(interaction) {
  if (!interaction) return ''

  const body = interaction.emailBody?.trim()
  if (body && body.length > 10 && !body.startsWith('Subject:')) {
    return cleanEmailBody(body)
  }

  const content = (interaction.content || '').trim()
  if (!content) return ''

  const subjectBodyMatch = content.match(/^Subject:\s*.+?\n\n([\s\S]*)$/i)
  if (subjectBodyMatch?.[1]?.trim()) {
    return cleanEmailBody(subjectBodyMatch[1].trim())
  }

  const subjectOnlyMatch = content.match(/^Subject:\s*(.+)$/i)
  if (subjectOnlyMatch && !content.includes('\n\n')) {
    return ''
  }

  const withoutSubject = content.replace(/^Subject:\s*.+?\n+/i, '').trim()
  if (withoutSubject && withoutSubject !== content) {
    return cleanEmailBody(withoutSubject)
  }

  return cleanEmailBody(content)
}

export function getEmailSubject(interaction) {
  if (!interaction) return '(no subject)'
  if (interaction.emailSubject?.trim()) return interaction.emailSubject.trim()
  const m = (interaction.content || '').match(/^Subject:\s*(.+?)(?:\n\n|\n|$)/i)
  return m?.[1]?.trim() || '(no subject)'
}

/** Normalize to readable paragraphs (sentence breaks). */
export function formatReadableText(text) {
  if (!text?.trim()) return ''
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/([.!?])\s+(?=[A-Z])/g, '$1\n\n')
    .trim()
}

export function truncateText(text, max = 280) {
  const flat = (text || '').replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const slice = flat.slice(0, max)
  const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '))
  if (lastStop > 100) return `${slice.slice(0, lastStop + 1).trim()}…`
  return `${slice.trim()}…`
}

/** Full cleaned body for expand view. */
export function getInteractionFullText(interaction) {
  if (!interaction) return ''
  if (interaction.type !== 'email') return formatReadableText((interaction.content || '').trim())
  const body = getEmailBody(interaction)
  if (!body) return ''
  return formatReadableText(body)
}

/** Short preview for timeline cards. */
export function getInteractionDisplayText(interaction, maxLength = 280) {
  const full = getInteractionFullText(interaction)
  if (!full) {
    return interaction?.type === 'email' ? '(Marketing email — preview unavailable)' : ''
  }
  return truncateText(full, maxLength)
}

export function getPreviewLine(interaction, max = 100) {
  const body = getEmailBody(interaction)
  if (!body) return '(No message preview)'
  return truncateText(body, max)
}

export function getSenderLabel(interaction) {
  const c = interaction?.customerId
  if (interaction?.emailDirection === 'outbound') {
    return `To: ${interaction.emailTo || c?.email || 'customer'}`
  }
  return c?.name || interaction?.emailFrom || 'Unknown sender'
}

/** Mailbox folder: unread (needs reply), sent (outbound), responded (replied inbound). */
export function getMailboxFolder(interaction) {
  if (interaction?.emailDirection === 'outbound') return 'sent'
  if (interaction?.emailResponded) return 'responded'
  return 'unread'
}

export function isUnreadInboxItem(interaction) {
  return getMailboxFolder(interaction) === 'unread'
}

export function mailboxFolderCounts(emails = []) {
  const counts = { all: emails.length, unread: 0, sent: 0, responded: 0 }
  for (const e of emails) {
    const f = getMailboxFolder(e)
    if (f in counts) counts[f] += 1
  }
  return counts
}
