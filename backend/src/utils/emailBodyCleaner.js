const URL_PATTERN = /https?:\/\/[^\s\]\)<>"]+/gi
const BRACKET_LINK = /\[(?:https?:\/\/|www\.)[^\]]*\]/gi

const FOOTER_LINE = /^(?:questions\?|unsubscribe|terms of use|privacy|help center|this message was mailed|src:|netflix pte|©|\d{4}\s)/i

const cleanEmailBody = (text) => {
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

  return lines
    .join('\n')
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

module.exports = { cleanEmailBody }
