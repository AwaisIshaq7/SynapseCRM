import { Link } from 'react-router-dom'
import LoadingSpinner from '../LoadingSpinner'
import SentimentBadge from '../SentimentBadge'
import { capitalize } from '../../utils/formatters'
import { getStatusClasses } from '../../utils/sentimentUtils'
import clsx from 'clsx'

/** Two-panel selector — detail pane for selected customer (HCI #6). */
export default function CustomerPreviewPanel({ customer, loading, onClose }) {
  if (loading) {
    return (
      <div className="card h-full min-h-[320px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="card h-full min-h-[320px] flex flex-col items-center justify-center text-center p-8 text-gray-400">
        <p className="text-3xl mb-2">👈</p>
        <p className="text-sm">Select a customer to preview details here</p>
        <p className="text-xs mt-2">Scan the list, read details on the right</p>
      </div>
    )
  }

  const statusStyles = getStatusClasses(customer.status)

  return (
    <div className="card h-full flex flex-col page-section-enter">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{customer.name}</h2>
          <p className="text-sm text-gray-500">{customer.company}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm" aria-label="Close preview">
            ✕
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', statusStyles.bg, statusStyles.text)}>
          {capitalize(customer.status)}
        </span>
        <SentimentBadge label={customer.overallSentiment} size="xs" />
      </div>

      <dl className="space-y-2 text-sm flex-1">
        <div>
          <dt className="text-xs text-gray-400 uppercase">Email</dt>
          <dd className="text-gray-900 dark:text-white truncate">{customer.email}</dd>
        </div>
        {customer.phone && (
          <div>
            <dt className="text-xs text-gray-400 uppercase">Phone</dt>
            <dd>{customer.phone}</dd>
          </div>
        )}
      </dl>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 justify-end">
        <Link to={`/customers/${customer._id}`} className="btn-primary text-sm">
          Open full profile →
        </Link>
      </div>
    </div>
  )
}

