import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Sidebar from './Sidebar'
import Navbar  from './Navbar'

/**
 * Wraps protected pages — redirects to /login if not authenticated.
 * adminOnly prop restricts to admin role only.
 */
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Persistent sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          id="main-content"
          role="main"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}