import { useAuth } from '../hooks/useAuth'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

/**
 * Dark/Light mode toggle.
 * Uses AuthContext so the theme class and stored preference stay in sync.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useAuth()
  const isDark = theme === 'dark'

  const handleToggle = () => {
    toggleTheme()
  }

  return (
    <button
      onClick={handleToggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <SunIcon className="h-5 w-5" aria-hidden="true" /> : <MoonIcon className="h-5 w-5" aria-hidden="true" />}
    </button>
  )
}