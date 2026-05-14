import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
//import { useTheme } from '../hooks/useTheme'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedAuthBackground from '../components/AnimatedAuthBackground'
import MyCRMLogo from '../assets/MyCRMLOGO.svg'
import { 
  Brain, Mail, Lock, Eye, EyeOff, Users, Zap, Shield, 
  BarChart3, ArrowRight, Sparkles
} from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const { login } = useAuth()
  //const { theme } = useTheme()
  const navigate = useNavigate()
  
  // FORCE LIGHT MODE ON LOGIN PAGE - ignore user preference
  //const isDark = false // Always false for login page

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
      const result = await login(formData)
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

  // 4 Core Features for the right side
  const features = [
    {
      icon: Users,
      title: 'Unified View',
      description: 'Accounts, activity logs, sentiment analysis, and real-time churn risk signals in one dashboard.',
      iconColor: 'text-blue-500'
    },
    {
      icon: Zap,
      title: 'Fast Decisions',
      description: 'Reduce response time with AI-driven prioritization and instant RAG-powered customer insights.',
      iconColor: 'text-yellow-500'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Role-based views for Admin & Sales Manager roles with fully authenticated audit-ready workflows.',
      iconColor: 'text-green-500'
    },
    {
      icon: Brain,
      title: 'AI Churn Prediction',
      description: 'VADER sentiment analysis + Groq Llama 3.3 RAG for proactive customer retention.',
      iconColor: 'text-purple-500'
    }
  ]

  const handleGoogleSSO = () => {
    window.location.href = '/auth/google'
  }

  const handleMicrosoftSSO = () => {
    window.location.href = '/auth/microsoft'
  }

  return (
    // Force light mode classes - no dark mode variants
    <div className="relative min-h-screen overflow-hidden bg-white">
      <AnimatedAuthBackground />

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Column: Login Form - Light mode only */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-6 bg-white/50">
          <div className="w-full max-w-sm">
            {/* Logo centered above form */}
            <div className="flex justify-center mb-6">
              <img 
                src={MyCRMLogo} 
                alt="SynapseCRM Logo" 
                className="h-16 w-auto"
                style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(98%) saturate(3000%) hue-rotate(250deg) brightness(100%) contrast(95%)' }}
              />
            </div>

            {/* Error Alert - Light mode only */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700">
                <p className="text-xs font-medium">Please fix the errors below to continue</p>
              </div>
            )}

            {/* Form Card - Light mode only */}
            <div className="rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl ring-1 bg-white/70 border border-gray-200/50 ring-gray-200/20">
              <div className="p-5 md:p-6">
                {/* Header - Light mode only */}
                <div className="mb-5 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Welcome back
                  </h2>
                  <p className="text-xs text-gray-600">
                    Sign in to your AI-powered workspace
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-3">
                  {/* Email Field - Light mode only */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium mb-1.5 text-gray-700">
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
                        className={`w-full pl-9 pr-3 py-2 rounded-lg border transition-all text-sm ${
                          errors.email
                            ? 'border-red-300 bg-red-50 text-gray-900 placeholder-red-400'
                            : 'border-gray-300 bg-white/80 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-invalid={!!errors.email}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field - Light mode only */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="password" className="block text-xs font-medium text-gray-700">
                        Password
                      </label>
                      <a href="#" className="text-xs transition-colors text-purple-600 hover:text-purple-700">
                        Forgot password?
                      </a>
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
                        className={`w-full pl-9 pr-9 py-2 rounded-lg border transition-all text-sm ${
                          errors.password
                            ? 'border-red-300 bg-red-50 text-gray-900 placeholder-red-400'
                            : 'border-gray-300 bg-white/80 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-invalid={!!errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me Checkbox - Light mode only */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                        className="w-3.5 h-3.5 rounded border bg-white border-gray-300 accent-purple-600"
                      />
                      <span className="ml-2 text-xs text-gray-600">
                        Remember me
                      </span>
                    </label>
                  </div>

                  {/* Sign In Button - Light mode only */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 mt-4 shadow-md text-sm bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Social Login Buttons - Light mode only */}
                <div className="relative my-4 flex items-center">
                  <div className="grow border-t border-gray-200"></div>
                  <span className="px-3 text-xs font-medium text-gray-400">Or continue with</span>
                  <div className="grow border-t border-gray-200"></div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleGoogleSSO}
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all text-xs border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    className="w-full py-2 px-4 rounded-lg border font-medium flex items-center justify-center gap-2 transition-all text-xs border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 23 23">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                      <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
                      <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
                      <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                    </svg>
                    Continue with Microsoft
                  </button>
                </div>

                {/* Sign Up Link - Light mode only */}
                <p className="mt-5 text-center text-xs text-gray-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold transition-colors text-purple-600 hover:text-purple-700">
                    Create free account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Feature Showcase - 4 Cards - Light mode only */}
        <div className="w-0 lg:w-auto lg:flex-1 flex items-center justify-center p-4 md:p-6 overflow-hidden lg:overflow-visible relative bg-linear-to-br from-purple-50 via-indigo-50 to-blue-50">
          <div className="w-full max-w-md">
            {/* Feature Grid Header - Light mode only */}
            <div className="mb-5 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mx-auto mb-3">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-[10px] font-semibold text-purple-600">AI-Powered Platform</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                AI-Driven Customer Intelligence
              </h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                Everything you need to predict, prevent, and act on customer churn.
              </p>
            </div>

            {/* 4 Feature Cards - 2x2 Grid - Light mode only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch mb-5">
              {features.map((feature, idx) => {
                const IconComponent = feature.icon
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border backdrop-blur-md shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group cursor-default bg-white/60 border-gray-200/60 hover:bg-white/80"
                  >
                    <div className="rounded-lg w-8 h-8 flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105 bg-white/80">
                      <IconComponent className={`w-4 h-4 ${feature.iconColor}`} />
                    </div>
                    <h4 className="font-semibold text-sm mb-1 text-gray-900">
                      {feature.title}
                    </h4>
                    <p className="text-[11px] leading-relaxed text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Trust Badges - Light mode only */}
            <div className="mt-3 pt-3 border-t border-gray-200/60">
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-medium text-gray-500">99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-purple-500" />
                  <span className="text-[10px] font-medium text-gray-500">SOC 2 Type II</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-purple-500" />
                  <span className="text-[10px] font-medium text-gray-500">Real-time Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}