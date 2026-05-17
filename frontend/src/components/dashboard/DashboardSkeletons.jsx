import React from 'react'
import clsx from 'clsx'

export const StatCardSkeleton = () => (
  <div className="rounded-3xl border border-slate-100/50 bg-slate-50/50 p-5 dark:border-slate-800/50 dark:bg-slate-900/40 relative overflow-hidden">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    <div className="flex items-center gap-4 mb-4">
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"></div>
      <div className="h-4 w-24 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80"></div>
    </div>
    <div className="h-8 w-20 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800/80 mb-2"></div>
    <div className="h-3 w-32 animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-800/60 mt-4"></div>
  </div>
)

export const ChartSkeleton = () => (
  <div className="flex flex-col h-64 justify-between relative overflow-hidden rounded-3xl border border-slate-100/50 bg-slate-50/50 p-6 dark:border-slate-800/50 dark:bg-slate-900/40">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />
    {/* Mock chart lines */}
    <div className="w-1/3 h-4 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 animate-pulse mb-6"></div>
    <div className="flex-1 flex items-end gap-3 px-2">
      {[40, 70, 45, 90, 65, 80, 55, 30, 85].map((height, i) => (
        <div key={i} className="w-full rounded-t-lg bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" style={{ height: `${height}%`, animationDelay: `${i * 0.1}s` }}></div>
      ))}
    </div>
    <div className="w-full h-px bg-slate-200/80 dark:bg-slate-800/80 mt-2"></div>
  </div>
)

export const AlertSkeleton = () => (
  <div className="space-y-3 relative">
    {[1, 2, 3].map((i) => (
      <div key={i} className="relative overflow-hidden rounded-2xl border border-slate-100/50 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-slate-900/40 flex items-start gap-4">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/5" style={{ animationDelay: `${i * 0.2}s` }} />
        <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 animate-pulse"></div>
          <div className="h-3 w-1/2 rounded-md bg-slate-200/60 dark:bg-slate-800/60 animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
)
