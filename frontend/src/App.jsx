import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PrototypePage from './pages/PrototypePage'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// ─── Placeholder for pages not yet built ────────────────────
// Remove each placeholder as you build the real page
function ComingSoon({ name }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-4xl mb-3">🚧</p>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{name}</p>
        <p className="text-sm text-gray-400 mt-1">Coming soon — Week 3+</p>
      </div>
    </div>
  )
}

export default function App() {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
            Connecting to SynapseCRM...
          </p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/customers"  element={<ComingSoon name="Customers" />} />
        <Route path="/reports"    element={<ComingSoon name="Reports" />} />
        <Route path="/settings"   element={<ComingSoon name="Settings" />} />
        <Route path="/users"      element={<ComingSoon name="User Management" />} />
      </Route>

      {/* Temporary demo-only public access */}
      <Route
        path="/demo-dashboard"
        element={DEMO_MODE ? <DashboardPage /> : <Navigate to="/login" replace />}
      />

      <Route path="/prototype" element={<PrototypePage />} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-6xl font-bold text-brand-600">404</p>
            <p className="mt-2 text-gray-500">Page not found</p>
          </div>
        </div>
      } />
    </Routes>
  )
}