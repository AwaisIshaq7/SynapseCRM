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
export function getStatusClasses(status) {
  switch (status) {
    case 'active':   return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' }
    case 'at_risk':  return { bg: 'bg-red-100 dark:bg-red-900/30',   text: 'text-red-700 dark:text-red-400' }
    case 'inactive': return { bg: 'bg-gray-100 dark:bg-gray-700',     text: 'text-gray-600 dark:text-gray-400' }
    default:         return { bg: 'bg-gray-100 dark:bg-gray-700',     text: 'text-gray-600 dark:text-gray-400' }
  }
}