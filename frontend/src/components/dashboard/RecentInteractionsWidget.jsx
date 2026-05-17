import React from 'react'
import SentimentBadge from '../SentimentBadge'
import { timeAgo } from '../../utils/formatters'
import { AlertSkeleton } from './DashboardSkeletons'

export default function RecentInteractionsWidget({ summary, loading, trackWidget }) {
  const recentCount = summary?.recentInteractions?.length || 0

  return (
    <section className="card scroll-animate" onClick={() => trackWidget('recent')}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Interactions
      </h2>
      {loading ? (
        <AlertSkeleton />
      ) : recentCount > 0 ? (
        <ul className="space-y-3">
          {summary.recentInteractions.map((interaction, idx) => (
            <li key={interaction._id} className="interaction-item" style={{ animationDelay: `${idx * 0.03}s` }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-sm shrink-0 border border-slate-100 dark:border-slate-700">
                  {interaction.type === 'call' ? '📞' : interaction.type === 'email' ? '📧' : interaction.type === 'meeting' ? '🤝' : '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {interaction.customerId?.name || 'Unknown Customer'}
                    </p>
                    <SentimentBadge label={interaction.sentimentLabel} size="xs" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                    {interaction.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {interaction.customerId?.company}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {timeAgo(interaction.date)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
          No recent interactions
        </p>
      )}
    </section>
  )
}
