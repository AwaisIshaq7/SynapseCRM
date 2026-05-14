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
  colorClass = 'text-brand-600 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20',
  loading = false,
  onClick,
}) {
  return (
    <div
      className={clsx(
        'card group transition-all duration-700 ease-out hover:shadow-2xl',
        onClick && 'cursor-pointer hover:-translate-y-2'
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
          <div className={clsx('p-3 rounded-xl transition-all duration-700 ease-out group-hover:scale-125', colorClass)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}