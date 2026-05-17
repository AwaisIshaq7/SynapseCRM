import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import Navbar from './Navbar'
import TopNavigation from './TopNavigation'
import Sidebar from './Sidebar'
import SkipToMain from './SkipToMain'

const Layout = () => {
  const { user } = useAuth()
  useKeyboardShortcuts()
  const location = useLocation()
  const routeKey = location.pathname.split('/')[1] || 'dashboard'

  const routeAccentMap = {
    dashboard: 'route-accent-dashboard',
    customers: 'route-accent-customers',
    reports: 'route-accent-reports',
    users: 'route-accent-users',
    settings: 'route-accent-settings',
  }

  const routeAccentClass = routeAccentMap[routeKey] || 'route-accent-dashboard'
  const isAdmin = user?.role === 'admin'

  const mainClass =
    'flex-1 overflow-x-hidden overflow-y-auto scroll-region-annotated px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 outline-none'

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SkipToMain />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.35),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.4),transparent_45%)]"
      />
      <div aria-hidden="true" className={`route-accent-layer ${routeAccentClass}`} />

      {isAdmin ? (
        <div className="relative z-10 flex min-h-screen">
          <Sidebar />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
            <Navbar />
            <main id="main-content" tabIndex={-1} className={mainClass}>
              <div key={location.pathname} className="mx-auto w-full max-w-7xl page-route-enter">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      ) : (
        <>
          <TopNavigation />
          <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
            <Navbar />
            <main id="main-content" tabIndex={-1} className={mainClass}>
              <div key={location.pathname} className="mx-auto w-full max-w-7xl page-route-enter">
                <Outlet />
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  )
}

export default Layout

