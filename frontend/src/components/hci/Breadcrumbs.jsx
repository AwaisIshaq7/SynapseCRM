import { Link } from 'react-router-dom'
import clsx from 'clsx'

/**
 * Breadcrumbs — shows hierarchy (not browser history). HCI pattern #13.
 */
export default function Breadcrumbs({ items, className }) {
  if (!items?.length) return null

  return (
    <nav aria-label="Breadcrumb" className={clsx('mb-6', className)}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">›</span>}
              {isLast || !item.to ? (
                <span
                  className={clsx(
                    isLast && 'font-medium text-gray-900 dark:text-white'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
