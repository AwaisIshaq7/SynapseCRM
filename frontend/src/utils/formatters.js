/**
 * Format a date string to a readable format
 * e.g. "2024-01-15T10:30:00Z" → "Jan 15, 2024"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

/**
 * Format date to relative time
 * e.g. "2 days ago", "3 hours ago"
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  const intervals = [
    { label: 'year',   secs: 31536000 },
    { label: 'month',  secs: 2592000 },
    { label: 'week',   secs: 604800 },
    { label: 'day',    secs: 86400 },
    { label: 'hour',   secs: 3600 },
    { label: 'minute', secs: 60 },
  ]
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

/**
 * Format interaction type with icon name
 */
export function getInteractionIcon(type) {
  const icons = {
    call:    '📞',
    email:   '📧',
    meeting: '🤝',
    note:    '📝',
  }
  return icons[type] || '💬'
}

/**
 * Truncate text to a max length
 */
export function truncate(str, max = 80) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}