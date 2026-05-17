const URL_PATTERN = /https?:\/\/[^\s\]\)<>"]+/gi
const BRACKET_LINK = /\[(?:https?:\/\/|www\.)[^\]]*\]/gi

const FOOTER_LINE = /^(?:questions\?|unsubscribe|terms of use|privacy|help center|this message was mailed|src:|netflix pte|©|\d{4}\s)/i

/** Strip tracking URLs, bracket links, and newsletter footers from plain-text email bodies. */
export function cleanEmailBody(text) {
  if (!text?.trim()) return ''

  let cleaned = text
    .replace(BRACKET_LINK, '')
    .replace(URL_PATTERN, '')
    .replace(/<\s*https?:[^>]+>/gi, '')

  const lines = cleaned.split('\n').filter((line) => {
    const trimmed = line.trim()
    if (!trimmed) return true
    if (FOOTER_LINE.test(trimmed)) return false
    if (/^[\s|·•\-_=]+$/.test(trimmed)) return false
    return true
  })

  cleaned = lines
    .join('\n')
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

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

export function getPreviewLine(interaction, max = 100) {
  const body = getEmailBody(interaction)
  if (!body) return '(No message preview)'
  const line = body.replace(/\s+/g, ' ').trim()
  return line.length > max ? `${line.slice(0, max)}…` : line
}

export function getSenderLabel(interaction) {
  const c = interaction?.customerId
  if (interaction?.emailDirection === 'outbound') {
    return `To: ${interaction.emailTo || c?.email || 'customer'}`
  }
  return c?.name || interaction?.emailFrom || 'Unknown sender'
}
