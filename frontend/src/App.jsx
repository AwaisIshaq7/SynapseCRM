import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'))
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'))
const CustomerFormPage = lazy(() => import('./pages/CustomerFormPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  const { loading, user } = useAuth()

  // Show full-screen spinner while verifying JWT
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
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
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
      />
      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />
      <Route
        path="/reset-password/:token"
        element={<ResetPasswordPage />}
      />

      {/* Protected routes — require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<CustomerFormPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin-only route */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}