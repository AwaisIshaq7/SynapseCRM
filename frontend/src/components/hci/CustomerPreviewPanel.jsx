import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'
import SentimentBadge from '../SentimentBadge'
import PriorityBadge from '../PriorityBadge'
import { capitalize } from '../../utils/formatters'
import { getStatusClasses } from '../../utils/sentimentUtils'
import clsx from 'clsx'

/** Short right-hand preview — content height only, no tall empty stretch. */
const panelShell = 'card w-full self-start p-3'

export default function CustomerPreviewPanel({ customer, loading, onClose }) {
  if (loading) {
    return (
      <div className={panelShell} aria-busy="true" aria-label="Loading customer preview">
        <div className="flex items-center justify-center py-6">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className={`${panelShell} text-center py-6`}>
        <p className="text-xl mb-1" aria-hidden="true">👈</p>
        <p className="text-sm text-readable font-medium">Select a customer</p>
      </div>
    )
  }

  const statusStyles = getStatusClasses(customer.status)

  return (
    <div className={`${panelShell} page-section-enter`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{customer.name}</h2>
          {customer.company && (
            <p className="text-sm text-muted truncate">{customer.company}</p>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="mt-1.5 flex items-start gap-1.5 text-base font-semibold text-brand-600 dark:text-brand-400 hover:underline break-all leading-snug"
            >
              <Mail className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{customer.email}</span>
            </a>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close preview"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', statusStyles.bg, statusStyles.text)}>
          {capitalize(customer.status)}
        </span>
        <SentimentBadge label={customer.overallSentiment} size="xs" />
        <PriorityBadge priority={customer.priority} score={customer.priorityScore} size="xs" />
      </div>

      {customer.phone && (
        <p className="text-sm text-muted mb-2">
          <span className="font-semibold text-gray-800 dark:text-gray-200">Phone: </span>
          {customer.phone}
        </p>
      )}

      <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
        <Link to={`/customers/${customer._id}`} className="btn-primary text-sm w-full text-center block py-2">
          Open full profile →
        </Link>
      </div>
    </div>
  )
}

