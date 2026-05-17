import React from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { getChurnRiskClasses } from '../../utils/sentimentUtils'
import { AlertSkeleton } from './DashboardSkeletons'

export default function ChurnAlertsWidget({ summary, loading, trackWidget }) {
  const alertCount = summary?.churnAlerts?.length || 0

  return (
    <section className="card border-l-4 border-l-red-500 scroll-animate" onClick={() => trackWidget('alerts')}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          ⚠️ Churn Alerts
        </h2>
        {alertCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold dark:bg-red-900/30 dark:text-red-400">
            {alertCount}
          </span>
        )}
      </div>
      {loading ? (
        <AlertSkeleton />
      ) : alertCount > 0 ? (
        <ul className="space-y-2">
          {summary.churnAlerts.map((alert, idx) => {
            const churnStyles = getChurnRiskClasses(alert.churnScore)
            return (
              <li key={alert._id} className="alert-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                <Link
                  to={`/customers/${alert._id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{alert.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{alert.company}</p>
                  </div>
                  <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', churnStyles.text, churnStyles.bg)}>
                    {churnStyles.label} {alert.churnScore != null ? `(${(alert.churnScore * 100).toFixed(0)}%)` : ''}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          🎉 No high-risk churn alerts
        </p>
      )}
    </section>
  )
}
