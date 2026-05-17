import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { customersApi } from '../api/customersApi'
import { emailApi } from '../api/emailApi'
import LoadingSpinner from './LoadingSpinner'
import SentimentBadge from './SentimentBadge'
import PriorityBadge from './PriorityBadge'
import { getEmailSubject, getPreviewLine, getSenderLabel } from '../utils/emailHelpers'
import { timeAgo } from '../utils/formatters'

const REFRESH_MS = 20000

export default function PriorityInbox() {
  const [customers, setCustomers] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [custRes, mailRes] = await Promise.allSettled([
        customersApi.getPriorityInbox(),
        emailApi.getMailbox({ limit: 30, folder: 'unread' }),
      ])

      if (custRes.status === 'fulfilled' && custRes.value.data.success) {
        setCustomers(
          custRes.value.data.data
            .filter((c) => c.priority === 'urgent' || c.priority === 'high')
            .slice(0, 3)
        )
      }

      if (mailRes.status === 'fulfilled' && mailRes.value.data.success) {
        const inbound = (mailRes.value.data.data || [])
          .filter((e) => e.emailDirection !== 'outbound')
          .slice(0, 3)
        setMessages(inbound)
      }
    } catch {
      setCustomers([])
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  if (loading) {
    return (
      <div className="card flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  const hasContent = customers.length > 0 || messages.length > 0

  if (!hasContent) {
    return (
      <div className="card text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        No urgent follow-ups. Sync emails or analyze customers to populate priorities.
      </div>
    )
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Priority inbox</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Top 3 urgent · last 3 unread messages</p>
        </div>
        <Link to="/emails" className="text-sm text-brand-600 hover:underline font-medium">
          Open inbox →
        </Link>
      </div>

      {customers.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Urgent accounts</p>
          <ul className="space-y-2">
            {customers.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/customers/${c._id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.lastEmailSubject || c.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <PriorityBadge priority={c.priority} score={c.priorityScore} size="xs" />
                    <SentimentBadge label={c.overallSentiment} size="xs" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {messages.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Latest unread messages</p>
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m._id}>
                <Link
                  to="/emails"
                  className="block p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {getEmailSubject(m)}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(m.date)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{getSenderLabel(m)}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{getPreviewLine(m, 100)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
