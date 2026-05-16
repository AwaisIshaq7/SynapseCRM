import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import MyCRMLogo from '../assets/MyCRMLOGO.svg'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const { forgotPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email is required')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const result = await forgotPassword(email)
      if (result.success) {
        setSubmitted(true)
        toast.success('Check your email for reset instructions')
      } else {
        setError(result.error || 'Failed to send reset email')
        toast.error(result.error || 'Failed to send reset email')
      }
    } catch {
      setError('Connection failed. Please try again.')
      toast.error('Connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    try {
      const result = await forgotPassword(email)
      if (result.success) {
        toast.success('Reset email sent successfully')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8 animate-slideDown">
          <div className="flex justify-center mb-4">
            <img 
              src={MyCRMLogo} 
              alt="SynapseCRM Logo" 
              className="h-12 w-auto"
              style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(98%) saturate(3000%) hue-rotate(250deg) brightness(100%) contrast(95%)' }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
          <p className="text-gray-600">We'll send you instructions to reset your password</p>
        </div>

        {!submitted ? (
          /* Email Submission Form */
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-scaleIn">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    placeholder="you@company.com"
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                  />
                </div>
                {error && (
                  <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 mt-6 shadow-md bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-600">
                💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-scaleIn text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                The reset link expires in 15 minutes. If you don't receive the email, check your spam folder.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-purple-600 transition-all duration-300 border border-purple-200 bg-white hover:bg-purple-50 disabled:opacity-50"
              >
                {loading ? 'Resending...' : 'Resend Email'}
              </button>

              <Link
                to="/login"
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 inline-flex items-center justify-center"
              >
                Back to Login
              </Link>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              Remember your password?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
