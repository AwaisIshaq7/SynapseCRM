import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import clsx from 'clsx'
import SentimentBadge from './SentimentBadge'
import PriorityBadge from './PriorityBadge'
import { getStatusClasses, getChurnRiskClasses } from '../utils/sentimentUtils'
import { capitalize, formatDate } from '../utils/formatters'

/** Compact customer card for list views; supports two-panel selection on xl. */
export default function CustomerCard({ customer, isSelected, onCardClick, onDelete, className: extraClass }) {
  const statusStyles = getStatusClasses(customer.status)
  const churnStyles = getChurnRiskClasses(customer.churnScore)

  const className = clsx(
    'card block h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-out group flex flex-col',
    isSelected && 'ring-2 ring-brand-500 shadow-lg',
    extraClass
  )

  const content = (
    <>
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
            <span className="text-brand-700 dark:text-brand-300 font-semibold text-sm">
              {customer.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors truncate">
              {customer.name}
            </p>
            <p className="text-sm text-muted truncate">{customer.company}</p>
          </div>
        </div>
        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', statusStyles.bg, statusStyles.text)}>
          {capitalize(customer.status)}
        </span>
      </div>

      <div className="text-sm text-muted mb-3 space-y-1 flex-1 min-h-0">
        <p className="truncate">{customer.email}</p>
        {customer.phone && <p>{customer.phone}</p>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 flex-wrap gap-2 mt-auto">
        <SentimentBadge label={customer.overallSentiment} size="xs" />
        <PriorityBadge priority={customer.priority} score={customer.priorityScore} size="xs" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">Churn:</span>
          <span className={clsx('text-xs font-medium', churnStyles.text)}>{churnStyles.label}</span>
        </div>
        <p className="text-xs text-muted">
          {customer.lastContactDate ? formatDate(customer.lastContactDate) : 'No contact'}
        </p>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(customer)
            }}
            className="ml-auto p-2 rounded-lg text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
            aria-label={`Delete ${customer.name}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  )

  return (
    <Link
      to={`/customers/${customer._id}`}
      className={className}
      aria-label={`View details for ${customer.name}`}
      aria-current={isSelected ? 'true' : undefined}
      onClick={onCardClick ? (e) => onCardClick(customer, e) : undefined}
    >
      {content}
    </Link>
  )
}

