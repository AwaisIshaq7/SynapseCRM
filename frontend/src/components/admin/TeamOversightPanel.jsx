import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ChevronRight, UserCheck } from 'lucide-react'
import clsx from 'clsx'
import LoadingSpinner from '../LoadingSpinner'
import SentimentBadge from '../SentimentBadge'
import { timeAgo } from '../../utils/formatters'

export default function TeamOversightPanel({ data, loading }) {
  const managers = data?.managerDetails || []
  const [selectedId, setSelectedId] = useState(null)

  const selected = managers.find((m) => m._id === selectedId) || managers[0] || null

  if (loading) {
    return (
      <div className="card flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sales Team Oversight</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Inspect portfolio accounts and live interaction feeds per sales manager
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-[420px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Sales managers</p>
          <ul className="max-h-[380px] overflow-y-auto">
            {managers.length === 0 ? (
              <li className="px-4 py-6 text-sm text-slate-500">No sales managers</li>
            ) : (
              managers.map((m) => {
                const active = selected?._id === m._id
                return (
                  <li key={m._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(m._id)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100/80 dark:border-slate-800/80 transition-colors',
                        active ? 'bg-white dark:bg-slate-900 shadow-sm' : 'hover:bg-white/70 dark:hover:bg-slate-900/50'
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm dark:bg-indigo-950/50 dark:text-indigo-300">
                        {m.name?.charAt(0)?.toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.customerCount} customers</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {(m.avgChurnScore ?? 0).toFixed(2)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        <div className="p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <UserCheck className="w-12 h-12 text-indigo-300 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">No manager selected</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Select a sales manager from the sidebar to inspect their clients, recent logs, and portfolio sentiment.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs rounded-full bg-slate-100 px-2.5 py-1 font-medium dark:bg-slate-800">
                    {selected.customerCount} customers
                  </span>
                  <span className="text-xs rounded-full bg-red-100 text-red-700 px-2.5 py-1 font-medium dark:bg-red-950/40 dark:text-red-300">
                    {selected.atRiskCount} at risk
                  </span>
                  <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 font-medium dark:bg-emerald-950/40">
                    Avg churn {(selected.avgChurnScore ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Clients</p>
                {selected.customers?.length > 0 ? (
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {selected.customers.slice(0, 8).map((c) => (
                      <li key={c._id}>
                        <Link
                          to={`/customers/${c._id}`}
                          className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                          <SentimentBadge label={c.overallSentiment} size="xs" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No customers assigned</p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recent interactions</p>
                {selected.recentInteractions?.length > 0 ? (
                  <ul className="space-y-2">
                    {selected.recentInteractions.slice(0, 5).map((item) => (
                      <li
                        key={item._id}
                        className="text-sm rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2"
                      >
                        <span className="font-medium capitalize text-slate-800 dark:text-slate-200">{item.type}</span>
                        <span className="text-slate-500">
                          {' '}
                          — {item.customerId?.name || 'Customer'}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">{timeAgo(item.date || item.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No recent activity</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
