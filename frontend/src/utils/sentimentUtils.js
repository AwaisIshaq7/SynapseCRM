// All sentiment-related helper functions — used across components

/**
 * Returns Tailwind color classes for a sentiment label
 * @param {string} label - 'positive' | 'neutral' | 'negative'
 */
export function getSentimentClasses(label) {
  switch (label?.toLowerCase()) {
    case 'positive':
      return {
        bg:   'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        dot:  'bg-green-500',
        ring: 'ring-green-200 dark:ring-green-800',
      }
    case 'negative':
      return {
        bg:   'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        dot:  'bg-red-500',
        ring: 'ring-red-200 dark:ring-red-800',
      }
    case 'neutral':
    default:
      return {
        bg:   'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        dot:  'bg-amber-500',
        ring: 'ring-amber-200 dark:ring-amber-800',
      }
  }
}

/**
 * Converts a numeric sentiment score (-1 to 1) to a label
 */
export function scoreToLabel(score) {
  if (score === null || score === undefined) return 'neutral'
  if (score > 0.2)  return 'positive'
  if (score < -0.2) return 'negative'
  return 'neutral'
}

/**
 * Returns churn risk color based on churnScore (0-1)
 */
export function getChurnRiskClasses(churnScore) {
  if (churnScore >= 0.7) return { text: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'High' }
  if (churnScore >= 0.4) return { text: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Medium' }
  return { text: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Low' }
}

/**
 * Returns Tailwind color class for customer status
 */
export function getPriorityClasses(priority) {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return {
        bg: 'bg-red-100 dark:bg-red-900/40',
        text: 'text-red-800 dark:text-red-300',
        dot: 'bg-red-600',
      }
    case 'high':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/40',
        text: 'text-orange-800 dark:text-orange-300',
        dot: 'bg-orange-500',
      }
    case 'low':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-400',
      }
    case 'medium':
    default:
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        text: 'text-blue-800 dark:text-blue-300',
        dot: 'bg-blue-500',
      }
  }
}

export const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }

export function getStatusClasses(status) {
  switch (status) {
    case 'active':   return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' }
    case 'at_risk':  return { bg: 'bg-red-100 dark:bg-red-900/30',   text: 'text-red-700 dark:text-red-400' }
    case 'inactive': return { bg: 'bg-gray-100 dark:bg-gray-700',     text: 'text-gray-600 dark:text-gray-400' }
    default:         return { bg: 'bg-gray-100 dark:bg-gray-700',     text: 'text-gray-600 dark:text-gray-400' }
  }
}