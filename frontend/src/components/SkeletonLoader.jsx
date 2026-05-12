/**
 * SkeletonLoader Component - Animated placeholder for loading states
 * Provides better UX than spinning loaders during data fetch
 */
export default function SkeletonLoader({ type = 'card', count = 1, className = '' }) {
  if (type === 'card') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="mb-4 space-y-3 rounded-2xl border border-slate-200/50 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/30">
            <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/2 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="h-3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-5/6 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'table-row') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="mb-3 flex items-center gap-4 rounded-xl border border-slate-200/50 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/30">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-2 w-1/2 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-3 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className={`rounded-2xl border border-slate-200/50 bg-slate-50 p-6 dark:border-slate-700/50 dark:bg-slate-800/30 ${className}`}>
        <div className="mb-4 h-4 w-1/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="mb-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-32 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'stat') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/50 bg-slate-50 p-6 dark:border-slate-700/50 dark:bg-slate-800/30">
            <div className="mb-3 h-3 w-1/2 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    )
  }

  return null
}
