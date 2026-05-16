import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(null) // null=loading, false=invalid, true=valid

  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const validate = async () => {
      if (!token) {
        if (mounted) setTokenValid(false)
        return
      }
      try {
        const res = await fetch(`/api/auth/validate-reset/${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!mounted) return
        if (res.ok && data.success) setTokenValid(true)
        else setTokenValid(false)
      } catch (err) {
        if (!mounted) return
        setTokenValid(false)
      }
    }
    validate()
    return () => { mounted = false }
  }, [token])

  const validate = () => {
    const errs = {}
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters'
    
    if (!formData.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    
    return errs
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const result = await resetPassword(token, formData.password, formData.confirmPassword)
      if (result.success) {
        setSuccess(true)
        toast.success('Password reset successfully! 🎉')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2000)
      } else {
        setErrors({ form: result.error || 'Failed to reset password' })
        toast.error(result.error || 'Failed to reset password')
      }
    } catch {
      setErrors({ form: 'Connection failed. Please try again.' })
      toast.error('Connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-sm text-gray-600 mb-4">This password reset link is invalid or has expired.</p>
          <div className="flex gap-2">
            <Link to="/forgot-password" className="flex-1 py-2 rounded bg-indigo-600 text-white text-sm">Request New Link</Link>
            <Link to="/login" className="flex-1 py-2 rounded border border-gray-200 text-sm">Back to Login</Link>
          </div>
        </div>
      </div>
    )
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Password Reset</h2>
          <p className="text-sm text-gray-600 mb-4">Your password has been reset. Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        {errors.form && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{errors.form}</div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full pl-9 pr-9 py-2.5 rounded-xl border transition-all duration-200 text-sm ${
                    errors.password
                      ? 'border-red-300 bg-red-50 text-gray-900 placeholder-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white'
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span>
                  {errors.password}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">At least 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full pl-9 pr-9 py-2.5 rounded-xl border transition-all duration-200 text-sm ${
                    errors.confirmPassword
                      ? 'border-red-300 bg-red-50 text-gray-900 placeholder-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white'
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
          <div>
            <button type="submit" disabled={loading} className="w-full py-2 rounded bg-indigo-600 text-white font-medium">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Resetting...</span>
                </div>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </div>
          </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-600">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
