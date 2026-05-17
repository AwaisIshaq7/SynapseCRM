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

const cleanEmailBody = (text) => {
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

  return lines.join('\n').replace(/[^\S\n]{2,}/g, ' ').trim()
}

module.exports = { cleanEmailBody }
