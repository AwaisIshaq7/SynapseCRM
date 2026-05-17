import { useState } from 'react'
import SentimentBadge from './SentimentBadge'
import PriorityBadge from './PriorityBadge'
import { formatDate, timeAgo, getInteractionIcon } from '../utils/formatters'
import { getEmailSubject, getInteractionFullText } from '../utils/emailHelpers'

const COLLAPSE_AFTER_CHARS = 1200

export default function InteractionHistoryItem({
  interaction,
  canDelete,
  onDelete,
}) {
  const isEmail = interaction.type === 'email'
  const fullText = getInteractionFullText(interaction) || (isEmail ? '' : (interaction.content || '').trim())
  const [expanded, setExpanded] = useState(isEmail)
  const flatFull = fullText.replace(/\n\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
  const canCollapse = flatFull.length > COLLAPSE_AFTER_CHARS
  const bodyText =
    !fullText && isEmail
      ? '(Marketing email — no readable body)'
      : expanded || !canCollapse
        ? fullText
        : `${flatFull.slice(0, COLLAPSE_AFTER_CHARS).trim()}…`

  return (
    <li className="flex gap-3 py-3 group first:pt-0 last:pb-0">
      <div
        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 text-base mt-0.5"
        aria-hidden="true"
      >
        {getInteractionIcon(interaction.type)}
      </div>
      <div className="flex-1 min-w-0 rounded-lg border border-gray-100 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/30 px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-base font-semibold text-gray-900 dark:text-white capitalize">
              {interaction.type}
            </span>
            <SentimentBadge
              score={interaction.sentimentScore}
              label={interaction.sentimentLabel}
              size="sm"
            />
            {isEmail && interaction.priority && (
              <PriorityBadge priority={interaction.priority} size="sm" />
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <time
              className="text-sm text-muted whitespace-nowrap"
              dateTime={interaction.date}
              title={formatDate(interaction.date)}
            >
              {timeAgo(interaction.date)}
            </time>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(interaction._id)}
                className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label={`Delete ${interaction.type} interaction`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {isEmail && (
          <p className="text-base font-semibold text-indigo-700 dark:text-indigo-300 mb-2 leading-snug break-words">
            {getEmailSubject(interaction)}
          </p>
        )}

        <p
          className={`text-base text-gray-800 dark:text-gray-100 leading-relaxed break-words ${
            expanded ? 'whitespace-pre-line' : ''
          }`}
        >
          {bodyText}
        </p>

        {canCollapse && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            aria-expanded={expanded}
          >
            {expanded ? 'Show less' : 'Show full email'}
          </button>
        )}

        {interaction.emailInsight && (
          <p className="mt-2.5 text-sm text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/25 px-3 py-2 rounded-md leading-relaxed border border-amber-200/60 dark:border-amber-800/40">
            {interaction.emailInsight}
          </p>
        )}
      </div>
    </li>
  )
}


