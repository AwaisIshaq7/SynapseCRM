/**
 * Empty state component — shown when no data is available
 * Follows Nielsen's heuristic: Help users recognize, diagnose, and recover
 */
export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4" aria-hidden="true">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{message}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  )
}