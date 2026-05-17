import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { getChurnRiskClasses, getStatusClasses } from '../../utils/sentimentUtils'
import SentimentBadge from '../SentimentBadge'
import PriorityBadge from '../PriorityBadge'
import LoadingSpinner from '../LoadingSpinner'
import { formatDate } from '../../utils/formatters'

function AlertSkeleton() {
  return (
    <ul className="space-y-3">
      {[1, 2, 3].map((i) => (
        <li key={i} className="animate-pulse rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
          <div className="mb-2 h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-56 rounded bg-slate-200 dark:bg-slate-700" />
        </li>
      ))}
    </ul>
  )
}

export default function ChurnAlertsPanel({ alerts = [], loading, className = '' }) {
  const list = alerts || []

  return (
    <section
      className={clsx(
        'rounded-2xl border border-red-200/80 bg-white shadow-sm dark:border-red-900/40 dark:bg-slate-900',
        'border-l-4 border-l-red-500',
        className
      )}
      aria-label="Churn risk alerts"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600 dark:text-red-400">
            Churn risk queue
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            Customers needing immediate attention
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            High churn score or at-risk status across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
            {loading ? '…' : list.length} alert{list.length !== 1 ? 's' : ''}
          </span>
          <Link
            to="/customers?status=at_risk"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            View all at-risk →
          </Link>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <AlertSkeleton />
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No churn alerts right now — portfolio looks stable.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((alert, idx) => {
              const churnStyles = getChurnRiskClasses(alert.churnScore ?? 0)
              const statusStyles = getStatusClasses(alert.status)
              const pct = alert.churnScore != null ? Math.round(alert.churnScore * 100) : 0

              return (
                <li
                  key={alert._id}
                  className="alert-item rounded-xl border border-red-100 bg-red-50/40 dark:border-red-900/30 dark:bg-red-950/20"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <Link
                    to={`/customers/${alert._id}`}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-colors rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{alert.name}</p>
                        <span
                          className={clsx(
                            'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                            statusStyles.bg,
                            statusStyles.text
                          )}
                        >
                          {(alert.status || 'unknown').replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                        {alert.email}
                        {alert.company ? ` · ${alert.company}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <SentimentBadge label={alert.overallSentiment} size="xs" />
                        {alert.priority && (
                          <PriorityBadge priority={alert.priority} size="xs" />
                        )}
                      </div>
                      {alert.lastContactDate && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Last contact {formatDate(alert.lastContactDate)}
                        </p>
                      )}
                    </div>

                    <div className="sm:w-44 shrink-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={clsx('font-bold', churnStyles.text)}>{churnStyles.label} risk</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 text-right">Open profile →</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
