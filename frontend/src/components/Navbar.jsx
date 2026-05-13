import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header
      className="sticky top-0 z-20 flex h-18 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/75 px-4 shadow-[0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 md:px-6"
      role="banner"
    >
      {/* Logo + App name — visible on mobile when sidebar is hidden */}
      <Link to="/dashboard" className="flex items-center md:hidden">
        <Logo size="small" />
      </Link>

      <div className="hidden md:block">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back, <span className="font-semibold text-slate-900 dark:text-white">{user?.name}</span>
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />

        {/* User menu */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/60 px-3 py-1.5 dark:border-slate-700/70 dark:bg-slate-950/30">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role?.replace('_', ' ')}</p>
          </div>
          {/* Avatar */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 shadow-[0_12px_24px_-12px_rgba(37,99,235,0.75)]"
            aria-hidden="true"
          >
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            aria-label="Log out of SynapseCRM"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}