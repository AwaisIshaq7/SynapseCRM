import React, { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../LoadingSpinner'
import { timeAgo } from '../../utils/formatters'
import clsx from 'clsx'

export default function DashboardTopBar({
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  showSearchResults,
  setShowSearchResults,
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  markNotificationRead,
  sseConnected
}) {
  const notificationsRef = useRef(null)
  const searchRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setShowNotifications, setShowSearchResults])

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      {/* Global Search Bar */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers by name, email, or company..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearchResults(true)
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searching && (
            <div className="absolute right-3 top-2.5">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
            {searchResults.map(customer => (
              <Link
                key={customer._id}
                to={`/customers/${customer._id}`}
                onClick={() => setShowSearchResults(false)}
                className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.email} • {customer.company}</p>
                </div>
                {customer.churnScore != null && (
                  <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-full', 
                    customer.churnScore > 0.7 ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' : 
                    customer.churnScore > 0.3 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                  )}>
                    {(customer.churnScore * 100).toFixed(0)}% risk
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* SSE Connection & Notification Bell */}
      <div className="flex items-center gap-4">
        {/* SSE connection dot status */}
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className={clsx('w-2 h-2 rounded-full', sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
          {sseConnected ? 'Realtime Connected' : 'Realtime Idle'}
        </span>

        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                Notifications ({unreadCount} new)
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">No notifications</p>
                ) : (
                  notifications.map(notification => {
                    const isAdminMsg = notification.type === 'admin_message'
                    return (
                      <div
                        key={notification._id}
                        onClick={() => markNotificationRead(notification._id)}
                        className={clsx('p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors flex items-start gap-2.5',
                          !notification.read && (isAdminMsg ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : 'bg-brand-50/50 dark:bg-brand-950/10')
                        )}
                      >
                        <span className={clsx("mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full",
                          isAdminMsg ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 text-xs shadow-sm" : "text-sm"
                        )}>
                          {isAdminMsg ? '👑' : (notification.type === 'churn_alert' ? '⚠️' : '🚨')}
                        </span>
                        <div className="min-w-0 flex-1">
                          {isAdminMsg && (
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                              {notification.data?.senderName || 'System Admin'}
                            </p>
                          )}
                          <p className={clsx(
                            "text-xs font-medium leading-relaxed",
                            isAdminMsg ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                          )}>
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">{timeAgo(notification.createdAt)}</p>
                        </div>
                        {!notification.read && (
                          <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0 self-center",
                            isAdminMsg ? "bg-indigo-500" : "bg-brand-500"
                          )} />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
