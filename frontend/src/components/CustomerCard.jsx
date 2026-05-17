import { Link } from 'react-router-dom'
import clsx from 'clsx'
import SentimentBadge from './SentimentBadge'
import { getStatusClasses, getChurnRiskClasses, getSentimentClasses } from '../utils/sentimentUtils'
import { capitalize, formatDate } from '../utils/formatters'
import { Calendar, Mail, Phone, Building } from 'lucide-react'

/**
 * Premium, layout-safe customer card for list views
 */
export default function CustomerCard({ customer }) {
  const statusStyles = getStatusClasses(customer.status)
  const churnStyles  = getChurnRiskClasses(customer.churnScore)
  const sentimentColors = getSentimentClasses(customer.overallSentiment)

  return (
    <Link
      to={`/customers/${customer._id}`}
      className="card block hover:shadow-xl dark:hover:shadow-brand-950/20 hover:-translate-y-1.5 transition-all duration-300 ease-out group border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm"
      aria-label={`View details for ${customer.name}`}
    >
      {/* Header Row — Identity and Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar Circle representing customer sentiment */}
          <div className={clsx(
            "w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm shadow-xs transition-all duration-300",
            sentimentColors.bg,
            sentimentColors.text
          )}>
            {customer.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-300 truncate text-sm">
              {customer.name}
            </h3>
            {customer.company && (
              <p className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                <Building size={11} className="text-slate-400/80 shrink-0" />
                <span className="truncate">{customer.company}</span>
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Status Badge with Pulsing Dot */}
        <span className={clsx(
          "inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs shrink-0",
          statusStyles.bg,
          statusStyles.text
        )}>
          <span className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0",
            customer.status === 'active' ? 'bg-green-500 animate-pulse' :
            customer.status === 'at_risk' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'
          )} />
          {customer.status === 'at_risk' ? 'At Risk' : customer.status}
        </span>
      </div>

      {/* Section 2 — Contact details */}
      <div className="py-3 space-y-2 border-t border-slate-100 dark:border-slate-800/60 my-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group/link">
          <Mail size={12} className="text-slate-400 dark:text-slate-500 group-hover/link:text-brand-500 transition-colors" />
          <span className="truncate group-hover/link:underline">{customer.email}</span>
        </div>
        {customer.phone && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group/link">
            <Phone size={12} className="text-slate-400 dark:text-slate-500 group-hover/link:text-brand-500 transition-colors" />
            <span className="group-hover/link:underline truncate">{customer.phone}</span>
          </div>
        )}
      </div>

      {/* Section 3 — Stacked Analytics Columns (Bug-Proof Formatting) */}
      <div className="space-y-3">
        {/* Row 3.1: Sentiment + Churn */}
        <div className="flex items-center justify-between">
          <SentimentBadge label={customer.overallSentiment} size="xs" />
          <span className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs",
            churnStyles.bg,
            churnStyles.text
          )}>
            Churn: {churnStyles.label}
          </span>
        </div>

        {/* Row 3.2: Chronological Last Contact Timeline */}
        <div className="flex items-center justify-between mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-2.5 border-t border-slate-100/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1 shrink-0">
            <Calendar size={11} className="text-slate-400 shrink-0" />
            <span>Last Contact:</span>
          </div>
          <span className="truncate pl-1">
            {customer.lastContactDate ? formatDate(customer.lastContactDate) : 'No contact history'}
          </span>
        </div>
      </div>
    </Link>
  )
}