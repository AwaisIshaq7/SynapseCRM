/** User-friendly Gmail / IMAP sync error text. */
export function getSyncErrorMessage(err) {
  const msg = err?.response?.data?.error || err?.message || ''
  const lower = String(msg).toLowerCase()

  if (lower.includes('imap') || lower.includes('smtp') || lower.includes('not configured')) {
    return 'Gmail sync failed. Add SMTP_USER and SMTP_PASS (16-character App Password) in backend/.env, then restart the server.'
  }
  if (lower.includes('invalid credentials') || lower.includes('authentication')) {
    return 'Gmail login failed. Use a Google App Password, not your normal Gmail password.'
  }
  if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('econnrefused')) {
    return 'Could not reach Gmail. Check your internet connection and try again.'
  }

  return msg || 'Sync from Gmail failed. Try again in a moment.'
}
