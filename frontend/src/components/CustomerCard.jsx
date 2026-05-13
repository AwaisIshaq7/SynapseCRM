import { Link } from 'react-router-dom'
import clsx from 'clsx'
import SentimentBadge from './SentimentBadge'
import { getStatusClasses, getChurnRiskClasses } from '../utils/sentimentUtils'
import { capitalize, formatDate } from '../utils/formatters'

/**
 * Compact customer card for list views
 */
export default function CustomerCard({ customer }) {
  const statusStyles = getStatusClasses(customer.status)
  const churnStyles  = getChurnRiskClasses(customer.churnScore)

  return (
    <Link
      to={`/customers/${customer._id}`}
      className="card block hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
      aria-label={`View details for ${customer.name}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar — first letter of name */}
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
            <span className="text-brand-700 dark:text-brand-300 font-semibold text-sm">
              {customer.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {customer.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{customer.company}</p>
          </div>
        </div>

        {/* Status badge */}
        <span className={clsx(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          statusStyles.bg, statusStyles.text
        )}>
          {capitalize(customer.status)}
        </span>
      </div>

      {/* Contact info */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 space-y-1">
        <p className="truncate">{customer.email}</p>
        {customer.phone && <p>{customer.phone}</p>}
      </div>

      {/* Bottom row — sentiment + churn risk */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <SentimentBadge label={customer.overallSentiment} size="xs" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Churn:</span>
          <span className={clsx('text-xs font-medium', churnStyles.text)}>
            {churnStyles.label}
          </span>
        </div>
        <p className="text-xs text-gray-400">
          {customer.lastContactDate ? formatDate(customer.lastContactDate) : 'No contact'}
        </p>
      </div>
    </Link>
  )
}