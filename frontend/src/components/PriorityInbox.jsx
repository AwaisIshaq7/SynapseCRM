import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { customersApi } from '../api/customersApi'
import LoadingSpinner from './LoadingSpinner'
import SentimentBadge from './SentimentBadge'
import PriorityBadge from './PriorityBadge'

export default function PriorityInbox() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customersApi
      .getPriorityInbox()
      .then((res) => {
        if (res.data.success) {
          setCustomers(res.data.data.filter((c) => c.priority === 'urgent' || c.priority === 'high').slice(0, 8))
        }
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="card text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        No urgent email follow-ups. Import or analyze emails to populate priorities.
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Priority inbox</h2>
        <Link to="/customers" className="text-sm text-brand-600 hover:underline font-medium">
          View all →
        </Link>
      </div>
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
                {c.emailInsight && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.emailInsight}</p>
                )}
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
  )
}
