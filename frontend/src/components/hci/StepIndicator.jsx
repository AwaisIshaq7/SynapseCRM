import clsx from 'clsx'

/** Sequence map — linear progress through a process (HCI #12). */
export default function StepIndicator({ steps, currentStep = 0 }) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, idx) => {
          const done = idx < currentStep
          const active = idx === currentStep
          return (
            <li key={step.id || step.label} className="flex flex-1 items-center gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2',
                    done && 'border-brand-600 bg-brand-600 text-white',
                    active && 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
                    !done && !active && 'border-gray-200 text-gray-400 dark:border-gray-600'
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? '✓' : idx + 1}
                </span>
                <span
                  className={clsx(
                    'hidden sm:block truncate text-sm font-medium',
                    active ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={clsx('hidden sm:block h-0.5 flex-1 rounded', done ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700')}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
