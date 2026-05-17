import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { storage } from '../../utils/storage'
import { timeAgo } from '../../utils/formatters'

export const RECENT_CUSTOMERS_EVENT = 'synapsecrm:recent-customers-updated'

/** Prospective memory — quick return to recently viewed customers; auto-refreshes. */
export default function RecentCustomers({ className = '' }) {
  const [recent, setRecent] = useState(() => storage.getRecentCustomers())

  const refresh = useCallback(() => {
    setRecent(storage.getRecentCustomers())
  }, [])

  useEffect(() => {
    refresh()
    const onStorage = (e) => {
      if (e.key === 'synapsecrm_recent_customers' || !e.key) refresh()
    }
    const onCustom = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener(RECENT_CUSTOMERS_EVENT, onCustom)
    const id = setInterval(refresh, 5000)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(RECENT_CUSTOMERS_EVENT, onCustom)
      clearInterval(id)
    }
  }, [refresh])

  if (!recent.length) return null

  return (
    <section className={className} aria-label="Recently viewed customers">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Recently viewed
      </h2>
      <ul className="space-y-2">
        {recent.map((c) => (
          <li key={c.id}>
            <Link
              to={`/customers/${c.id}`}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2
                         bg-white/80 dark:bg-slate-900/60 border border-gray-100 dark:border-gray-700
                         hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</span>
              <span className="text-xs text-gray-400 shrink-0">{timeAgo(c.viewedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
