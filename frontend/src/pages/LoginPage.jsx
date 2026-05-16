import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import MyCRMLogo from '../assets/MyCRMLOGO.svg'
import { 
  Brain, Mail, Lock, Eye, EyeOff, Users, Zap, Shield, 
  BarChart3, ArrowRight, 
} from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters'
    return errs
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
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
      const result = await login({ ...formData, rememberMe })
      if (result.success) {
        toast.success('Welcome back! 🎉')
        navigate('/dashboard', { replace: true })
      } else {
        toast.error(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error('Server is waking up (free tier). Please try again in a moment.')
      } else {
        toast.error('Connection failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: 'Unified View',
      description: 'Accounts, activity logs, sentiment analysis, and real-time churn risk signals.',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Zap,
      title: 'Fast Decisions',
      description: 'AI-driven prioritization and instant RAG-powered customer insights.',
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Role-based views with fully authenticated audit-ready workflows.',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: Brain,
      title: 'AI Churn Prediction',
      description: 'VADER sentiment analysis + Groq Llama 3.3 for proactive retention.',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const handleGoogleSSO = () => {
    window.location.href = '/auth/google'
  }

  const handleMicrosoftSSO = () => {
    window.location.href = '/auth/microsoft'
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* LEFT COLUMN: Feature Showcase - Soft gradient, elegant */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 relative bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
          <div className="w-full max-w-md">
            {/* Logo on left */}
            <div className="mb-8">
              <img 
                src={MyCRMLogo} 
                alt="SynapseCRM Logo" 
                className="h-20 w-auto mx-auto"
                style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(98%) saturate(3000%) hue-rotate(250deg) brightness(100%) contrast(95%)' }}
              />
            </div>

            {/* Feature Grid Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 mx-auto text-center">
                AI-Driven Customer Intelligence
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Everything you need to predict, prevent, and act on customer churn.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4">
              {features.map((feature, idx) => {
                const IconComponent = feature.icon
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/80 hover:bg-white transition-all duration-200 group cursor-default"
                  >
                    <div className={`p-2 rounded-xl ${feature.bgColor} group-hover:scale-105 transition-transform duration-200`}>
                      <IconComponent className={`w-5 h-5 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-gray-200/50">
              <div className="flex flex-wrap gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500">99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">SOC 2 Type II</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">Real-time Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form - PURE WHITE, no transparency */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white">
          <div className="w-full max-w-md">
            {/* Logo for mobile */}
            <div className="flex justify-center mb-8 lg:hidden">
              <img 
                src={MyCRMLogo} 
                alt="SynapseCRM Logo" 
                className="h-12 w-auto"
                style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(98%) saturate(3000%) hue-rotate(250deg) brightness(100%) contrast(95%)' }}
              />
            </div>

            {/* Header */}
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </h1>
              <p className="text-gray-500">
                Sign in to your AI-powered workspace
              </p>
            </div>

            {/* Error Alert */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs font-medium text-red-600">Please fix the errors below to continue</p>
              </div>
            )}

            {/* Form - Pure white card */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    disabled={loading}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg border transition-all text-sm ${
                      errors.email
                        ? 'border-red-300 bg-red-50 text-gray-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={loading}
                    className={`w-full pl-9 pr-9 py-2.5 rounded-lg border transition-all text-sm ${
                      errors.password
                        ? 'border-red-300 bg-red-50 text-gray-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-6 shadow-sm text-sm bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Social Login Buttons */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleGoogleSSO}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all text-sm border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                onClick={handleMicrosoftSSO}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all text-sm border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                  <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
                  <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                </svg>
                Continue with Microsoft
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-purple-600 hover:text-purple-700">
                Create free account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Features Section - Visible only on mobile */}
      <div className="lg:hidden bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              AI-Driven Intelligence
            </h3>
            <p className="text-sm text-gray-600">
              Predict, prevent, and act on customer churn
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/80"
                >
                  <div className={`p-1.5 rounded-lg ${feature.bgColor}`}>
                    <IconComponent className={`w-4 h-4 ${feature.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200/50">
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500">99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">Real-time Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}