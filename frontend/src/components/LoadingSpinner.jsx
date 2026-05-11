import clsx from 'clsx'

/**
 * Accessible loading spinner with aria-label
 */
export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx('inline-block', className)}
    >
      <div
        className={clsx(
          sizes[size],
          'rounded-full border-gray-200 border-t-brand-600 animate-spin dark:border-gray-700 dark:border-t-brand-400'
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}