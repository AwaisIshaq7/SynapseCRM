import clsx from 'clsx'
import { getPriorityClasses } from '../utils/sentimentUtils'

export default function PriorityBadge({ priority, score, size = 'sm' }) {
  if (!priority) return null

  const colors = getPriorityClasses(priority)
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-semibold rounded-full capitalize',
        sizeClass,
        colors.bg,
        colors.text
      )}
      title={score != null ? `Priority score: ${score}` : undefined}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', colors.dot)} aria-hidden />
      {priority}
    </span>
  )
}
