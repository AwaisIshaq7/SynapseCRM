import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header
      className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700
                 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
      role="banner"
    >
      {/* Logo + App name — visible on mobile when sidebar is hidden */}
      <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
        <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">S</span>
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-sm">SynapseCRM</span>
      </Link>

      <div className="hidden md:block">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Welcome back, <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />

        {/* User menu */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-600 dark:text-gray-400
                       dark:hover:text-red-400 transition-colors font-medium"
            aria-label="Log out of SynapseCRM"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}