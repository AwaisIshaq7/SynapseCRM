import clsx from 'clsx'
import { getSentimentClasses, scoreToLabel } from '../utils/sentimentUtils'
import { capitalize } from '../utils/formatters'

/**
 * Displays a color-coded sentiment badge.
 * Accepts either a label string OR a numeric score.
 * Handles null/undefined gracefully (sentiment may be null before AI service is ready).
 */
export default function SentimentBadge({ label, score, size = 'sm', showDot = true }) {
  // Determine the effective label
  const effectiveLabel = label || (score !== undefined ? scoreToLabel(score) : null)

  // Graceful null handling — show placeholder if no sentiment yet
  if (!effectiveLabel) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Analyzing...
      </span>
    )
  }

  const colors = getSentimentClasses(effectiveLabel)
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-sm px-3 py-1',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1',
        colors.bg,
        colors.text,
        colors.ring,
        sizeClasses[size]
      )}
      aria-label={`Sentiment: ${effectiveLabel}`}
    >
      {showDot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', colors.dot)}
          aria-hidden="true"
        />
      )}
      {capitalize(effectiveLabel)}
    </span>
  )
}