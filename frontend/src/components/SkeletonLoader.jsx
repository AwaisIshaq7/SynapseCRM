/**
 * SkeletonLoader Component - Animated placeholder for loading states
 * Provides better UX than spinning loaders during data fetch
 */
export default function SkeletonLoader({ type = 'card', count = 1, className = '' }) {
  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: count > 1 ? count : 8 }).map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl border border-slate-100/50 bg-slate-50/50 p-5 dark:border-slate-800/50 dark:bg-slate-900/40">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/5" style={{ animationDelay: `${i * 0.15}s` }} />
            
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800/80"></div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800/80"></div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-800/60" />
            </div>

            <div className="flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
              <div className="h-6 w-16 animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'table-row') {
    return (
      <div className={`overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${className}`}>
        <div className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          {/* Mock Header */}
          <div className="bg-slate-50 dark:bg-slate-950/40 px-6 py-4 flex gap-4">
            <div className="h-4 w-1/4 rounded bg-slate-200/50 dark:bg-slate-800/50"></div>
            <div className="h-4 w-1/4 rounded bg-slate-200/50 dark:bg-slate-800/50"></div>
            <div className="h-4 w-1/4 rounded bg-slate-200/50 dark:bg-slate-800/50"></div>
          </div>
          {/* Mock Rows */}
          {Array.from({ length: count > 1 ? count : 5 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden px-6 py-4 flex items-center gap-4 bg-white dark:bg-slate-900">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-slate-50/50 to-transparent dark:via-white/5" style={{ animationDelay: `${i * 0.1}s` }} />
              
              <div className="flex items-center gap-3 w-1/4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80" />
                  <div className="h-3 w-1/2 animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-800/60" />
                </div>
              </div>
              
              <div className="w-1/4">
                <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-800/60" />
              </div>

              <div className="w-1/4 flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
              </div>
              
              <div className="flex-1 flex justify-end">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80" />
              </div>
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
          <div key={i} className="relative overflow-hidden rounded-2xl border border-slate-100/50 bg-slate-50/50 p-6 dark:border-slate-800/50 dark:bg-slate-900/40">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/5" style={{ animationDelay: `${i * 0.2}s` }} />
            <div className="mb-3 h-3 w-1/2 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
          </div>
        ))}
      </div>
    )
  }

  return null
}
