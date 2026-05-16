import clsx from 'clsx'
import LoadingSpinner from './LoadingSpinner'

export default function StatCard({
  label,
  value,
  icon,
  trend,
  trendDown = false,
  trendValue,
  colorClass = 'text-brand-600 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20',
  loading = false,
  onClick,
}) {
  const hasTrend = trendValue || Number.isFinite(trend)
  const trendDirection = trend > 0 ? 'Up' : trend < 0 ? 'Down' : 'No change'
  const trendIsGood = trendDown ? trend <= 0 : trend >= 0

  return (
    <div
      className={clsx(
        'card group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={onClick ? `${label}: ${value}. Click to view details.` : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          {loading ? (
            <LoadingSpinner size="sm" className="mt-2" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {value ?? '-'}
            </p>
          )}
          {hasTrend && (
            <p className={clsx(
              'mt-1 text-xs font-semibold',
              trend === 0 ? 'text-gray-500' : trendIsGood ? 'text-green-600' : 'text-red-600'
            )}>
              {trendDirection} {trendValue || Math.abs(trend)}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('rounded-xl p-3 transition-transform duration-300 group-hover:scale-110', colorClass)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
