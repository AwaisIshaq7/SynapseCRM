import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    badge: 'Live',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ['admin', 'sales_manager'],
  },
  {
    to: '/customers',
    label: 'Customers',
    badge: 'CRM',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin', 'sales_manager'],
  },
  {
    to: '/reports',
    label: 'Reports',
    badge: 'AI',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['admin', 'sales_manager'],
  },
  {
    to: '/users',
    label: 'User Management',
    badge: 'Admin',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin'],
  },
  {
    to: '/settings',
    label: 'Settings',
    badge: 'Prefs',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    roles: ['admin', 'sales_manager'],
  },
]

export default function TopNavigation() {
  const { user } = useAuth()
  const location = useLocation()
  const isSalesManager = user?.role === 'sales_manager'

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role)
  )

  return (
    <nav
      className="relative flex justify-center border-b border-slate-200/50 bg-white/90 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/70 px-4 py-3 top-0 z-40 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      {isSalesManager && (
        <div className="absolute left-0 right-10 top-1/2 -translate-y-1/2 hidden md:flex ">
          <Logo size="normal" className="h-16" />
        </div>
      )}

      <div className="flex items-center gap-2">
        {visibleItems.map((item, index) => {
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ease-out hover:scale-105 active:scale-95',
                  isSalesManager ? '' : 'md:gap-3 md:px-6 md:py-3 md:rounded-xl md:font-bold md:text-base',
                  isActive
                    ? 'bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 dark:from-purple-600 dark:via-purple-700 dark:to-purple-800 dark:shadow-purple-600/40'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-purple-300 dark:hover:shadow-md dark:hover:shadow-purple-500/20'
                )
              }
              style={{
                animationDelay: `${index * 0.05}s`,
                animation: 'navItemEnter 0.5s ease-out forwards'
              }}
            >
              <span className={clsx(
                'inline-flex items-center justify-center transition-transform duration-300',
                isActive ? 'animate-pulse' : '',
                !isSalesManager ? 'md:text-lg' : ''
              )}>
                {item.icon}
              </span>
              <span className={!isSalesManager ? 'md:tracking-tight' : ''}>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
