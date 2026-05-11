import clsx from 'clsx'
import LoadingSpinner from './LoadingSpinner'

/**
 * Dashboard KPI stat card — shows icon, label, value, optional change indicator
 */
export default function StatCard({
  label,
  value,
  icon,
  trend,          // 'up' | 'down' | null
  trendValue,
  colorClass = 'text-brand-600 bg-brand-50 dark:bg-brand-900/20',
  loading = false,
  onClick,
}) {
  return (
    <div
      className={clsx(
        'card group transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={onClick ? `${label}: ${value}. Click to view details.` : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          {loading ? (
            <LoadingSpinner size="sm" className="mt-2" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
              {value ?? '—'}
            </p>
          )}
          {trendValue && (
            <p className={clsx(
              'mt-1 text-sm font-medium',
              trend === 'up'   ? 'text-green-600' : '',
              trend === 'down' ? 'text-red-600'   : 'text-gray-500'
            )}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('p-3 rounded-xl', colorClass)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}