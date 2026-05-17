import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    subtitle: 'Overview and health',
    badge: 'Live',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ['admin', 'sales_manager'],
  },
  {
    to: '/customers',
    label: 'Customers',
    subtitle: 'Pipeline and profiles',
    badge: 'CRM',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin', 'sales_manager'],
  },
  {
    to: '/reports',
    label: 'Reports',
    subtitle: 'Charts and trends',
    badge: 'AI',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['admin', 'sales_manager'],
  },
  {
    to: '/users',
    label: 'User Management',
    subtitle: 'Roles and access',
    badge: 'Admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin'],  // Only visible to admin
  },
  {
    to: '/settings',
    label: 'Settings',
    subtitle: 'Theme and preferences',
    badge: 'Prefs',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    roles: ['admin', 'sales_manager'],
  },
]

export default function Sidebar() {
  const { user } = useAuth()

  // Filter nav items by role
  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role)
  )

  return (
    <aside
      className="hidden w-80 shrink-0 flex-col border-r border-white/10 bg-linear-to-b from-white/30 to-white/10 backdrop-blur-xl dark:border-slate-800/40 dark:from-slate-900/30 dark:to-slate-950/20 md:flex relative overflow-hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Premium Glassmorphic glowing orbs in the background */}
      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="flex h-28 items-center justify-center px-6 relative z-10">
        <Logo size={user?.role === 'admin' ? 'normal' : 'small'} className="w-auto h-auto" />
      </div>
      
      {/* Navigation links */}
      <nav className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4 relative z-10">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'group flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-300 relative overflow-hidden border',
                isActive
                  ? 'border-brand-200/50 bg-linear-to-r from-brand-500/10 to-brand-500/5 text-brand-700 ring-2 ring-brand-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)] dark:border-brand-500/30 dark:from-brand-500/25 dark:to-brand-500/5 dark:text-brand-300'
                  : 'border-transparent text-slate-600 hover:border-slate-200/50 hover:bg-slate-100/50 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-800/40 dark:hover:bg-slate-800/40 dark:hover:text-slate-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Glowing vertical left indicator */}
                <div className={clsx(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-brand-500 dark:bg-brand-400 rounded-r-full transition-all duration-300 transform origin-left",
                  isActive ? "scale-y-100 opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "scale-y-0 opacity-0"
                )} />

                <div className={clsx(
                  "rounded-xl p-2.5 shadow-xs transition-all duration-300",
                  isActive
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                    : "bg-white/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:text-brand-500"
                )}>
                  {item.icon}
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-wide">{item.label}</p>
                  <p className="truncate text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                    {item.subtitle}
                  </p>
                </div>

                <span className={clsx(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] border transition-all duration-300",
                  isActive
                    ? "bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400"
                    : "border-slate-200 bg-white/50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500 group-hover:border-brand-500/20 group-hover:text-brand-500"
                )}>
                  {item.badge}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Workspace Indicator panel */}
      <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-linear-to-br from-white/30 to-white/5 p-4 dark:border-slate-800/40 dark:from-slate-900/30 dark:to-slate-900/10 backdrop-blur-md relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Workspace status</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>Realtime UI</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-brand-500/5 border border-brand-500/15 px-2.5 py-1 font-semibold text-brand-600 dark:text-brand-400">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500"></span>
            </span>
            <span>Adaptive</span>
          </div>
        </div>
      </div>

      {/* Role indicator at bottom */}
      <div className="border-t border-white/10 px-4 py-4 dark:border-slate-800/40 relative z-10 bg-white/10 dark:bg-slate-950/10">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{user?.name}</p>
            <p className="text-xs capitalize text-slate-400">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}