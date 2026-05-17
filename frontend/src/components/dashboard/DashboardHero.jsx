import React from 'react'
import { Link } from 'react-router-dom'
import { StatCardSkeleton } from './DashboardSkeletons'

export default function DashboardHero({ user, isAdmin, summary, recentCount, loading }) {
  const currentHour = new Date().getHours()
  const todayGreeting = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening'

  return (
    <div className="page-section-enter relative overflow-hidden rounded-3xl border border-slate-200 p-6 shadow-sm backdrop-blur dark:border-slate-700 sm:p-8">
      <div className="absolute inset-0 bg-linear-to-br from-white/95 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-950/85" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.04),transparent_50%)]" aria-hidden="true" />
      
      <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
            {isAdmin ? 'Admin cockpit' : 'Sales workspace'}
          </div>
          
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {isAdmin
              ? 'Run the customer operation from one command center.'
              : `Good ${todayGreeting}, ${user?.name?.split(' ')[0] || 'there'}. Keep every follow-up moving.`}
          </h1>
          
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {isAdmin
              ? 'Monitor customer health, churn exposure, and team activity without hopping between screens.'
              : 'Track customer sentiment, review churn risk, and focus on the conversations that need attention next.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/customers" className="btn-primary">Open customers</Link>
            <Link to="/reports" className="btn-secondary">View reports</Link>
            {isAdmin ? (
              <Link to="/users" className="btn-secondary">Manage users</Link>
            ) : (
              <Link to="/settings" className="btn-secondary">Review settings</Link>
            )}
          </div>
        </div>

        {/* Action cards on the side */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-slate-900 dark:bg-slate-950 p-4 text-white shadow-lg border border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Coverage</p>
                <p className="mt-2 text-3xl font-semibold text-white">{summary?.totalCustomers ?? 0}</p>
                <p className="mt-1 text-xs text-slate-400">customers under active watch</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/60 dark:bg-slate-900/60 p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Risk</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{summary?.atRiskCount ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">customers needing a closer look</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/60 dark:bg-slate-900/60 p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Activity</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{recentCount}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">recent interactions logged</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {(summary?.churnAlerts?.length || 0)} churn alerts
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {summary?.positiveCount ?? 0} positive signals
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {summary?.negativeCount ?? 0} negative signals
        </span>
      </div>
    </div>
  )
}
