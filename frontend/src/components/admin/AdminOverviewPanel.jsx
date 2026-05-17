import { Link } from 'react-router-dom'
import LoadingSpinner from '../LoadingSpinner'

export default function AdminOverviewPanel({ data, loading }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner />
        </div>
      </section>
    )
  }

  const stats = data?.systemStats || {}
  const managers = data?.managerDetails || []

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Team Overview
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
          Sales manager coverage
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Customers</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{stats.totalCustomers ?? 0}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Managers</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{stats.totalManagers ?? 0}</p>
        </div>
        <div className="rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-xs text-red-600 dark:text-red-300">At risk</p>
          <p className="mt-1 text-2xl font-semibold text-red-700 dark:text-red-200">{stats.atRiskTotal ?? 0}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
          <p className="text-xs text-emerald-600 dark:text-emerald-300">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-200">{stats.activeTotal ?? 0}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {managers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No sales managers found.
          </p>
        ) : (
          managers.slice(0, 5).map((manager) => (
            <Link
              key={manager._id}
              to="/users"
              className="block rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{manager.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{manager.email}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{manager.customerCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">customers</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {(manager.avgChurnScore ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
              {manager.atRiskCount > 0 && (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">
                  {manager.atRiskCount} at-risk customer{manager.atRiskCount === 1 ? '' : 's'}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
