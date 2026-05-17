import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from './ThemeToggle'
import MyCRMLogo from '../assets/MyCRMLOGO.svg'
import clsx from 'clsx'
import Tooltip from './Tooltip'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header
      className="sticky top-0 z-20 flex h-18 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/75 px-4 shadow-[0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:px-6"
      role="banner"
      >
      {/* Logo + App name — visible on mobile when sidebar is hidden */}
      <Link to="/dashboard" className="flex items-center md:hidden">
        <img
          src={MyCRMLogo}
          alt="SynapseCRM Logo"
          className="h-10 w-auto"
          style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(98%) saturate(3000%) hue-rotate(250deg) brightness(100%) contrast(95%)' }}
        />
      </Link>

      <div className="hidden md:flex flex-col">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
          {user?.role === 'admin' ? 'System Administrator' : 'Sales Executive'}
        </p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-350">
          Welcome back, <span className="font-extrabold text-slate-900 dark:text-white">{user?.name}</span>
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 ml-auto">
        <Tooltip content="Toggle Theme" position="bottom">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
            <ThemeToggle />
          </div>
        </Tooltip>

        {/* User menu */}
        <div className={clsx(
          "flex items-center gap-3.5 rounded-full border bg-white/60 px-2 py-1.5 dark:bg-slate-950/40 backdrop-blur-md shadow-xs transition-all duration-300",
          user?.role === 'admin' 
            ? "border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:shadow-indigo-500/10" 
            : "border-brand-100 dark:border-brand-900/30 hover:border-brand-300 dark:hover:border-brand-700/50 hover:shadow-brand-500/10"
        )}>
          <div className="text-right hidden sm:block pl-2">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
            <p className={clsx(
              "text-[9px] font-extrabold uppercase tracking-wider",
              user?.role === 'admin' ? "text-indigo-600 dark:text-indigo-400" : "text-brand-600 dark:text-brand-400"
            )}>
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          
          {/* Avatar with role-based glow */}
          <Tooltip content="Your Profile" position="bottom">
            <div
              className={clsx(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-lg border transition-transform duration-300 hover:scale-105 cursor-pointer",
                user?.role === 'admin' 
                  ? "bg-linear-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30 border-indigo-300/30" 
                  : "bg-linear-to-br from-brand-500 to-emerald-600 shadow-brand-500/30 border-brand-300/30"
              )}
              aria-hidden="true"
            >
              <span className="text-white font-extrabold text-sm drop-shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </Tooltip>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700/80 mx-0.5"></div>

          {/* Logout Button */}
          <Tooltip content="Sign Out" position="bottom">
            <button
              onClick={logout}
              className="pr-3 pl-1 text-xs font-bold text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1.5 group cursor-pointer"
              aria-label="Log out of SynapseCRM"
            >
              <span className="hidden sm:inline">Logout</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}