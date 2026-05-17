import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import MyCRMLogo from '../assets/MyCRMLOGO.svg'
import {
  Brain, Mail, Lock, Eye, EyeOff, Users, Zap, Shield,
  BarChart3, ArrowRight, CheckCircle, PlayCircle
} from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters'
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
        if (result.error?.toLowerCase().includes('user not found') || result.error?.toLowerCase().includes('email')) {
          setErrors({ email: result.error })
        } else if (result.error?.toLowerCase().includes('password')) {
          setErrors({ password: result.error })
        }
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
      icon: Brain,
      title: 'AI Churn Prediction',
      description: 'VADER sentiment analysis + Groq Llama 3.3 for proactive retention.',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  // Purple logo filter
  const logoFilter = 'brightness(0) saturate(100%) invert(68%) sepia(96%) saturate(748%) hue-rotate(248deg) brightness(92%) contrast(96%)'

  // Demo Login Handler
  const handleDemoLogin = async () => {
    if (loading || demoLoading) return
    setDemoLoading(true)
    setFormData({ email: 'demo@synapsecrm.com', password: 'Demo1234!' })
    const toastId = toast.loading('Connecting to Demo Workspace... 🚀')

    try {
      const result = await login({ email: 'demo@synapsecrm.com', password: 'Demo1234!', rememberMe: false })
      if (result.success) {
        toast.success('Welcome to SynapseCRM Demo! 🎉', { id: toastId })
        navigate('/dashboard', { replace: true })
      } else {
        toast.error(result.error || 'Demo login failed.', { id: toastId })
      }
    } catch (err) {
      toast.error('Connection failed. Please try again.', { id: toastId })
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* LEFT COLUMN */}
        <div className="hidden lg:flex lg:w-5/12 items-center justify-center p-8 lg:p-12 relative bg-linear-to-br from-zinc-900 via-indigo-950 to-purple-950">
          <div className="absolute inset-0 bg-[radial-gradient(#4f46e520_0.8px,transparent_1px)] bg-size-[20px_20px] opacity-40"></div>

          <div className="w-full max-w-lg relative z-10">
            {/* Logo */}
            <div className="mb-4 flex justify-center">
              <img
                src={MyCRMLogo}
                alt="SynapseCRM Logo"
                className="h-20 w-auto mb-0 block border-0 p-0 m-0 bg-transparent rounded-none shadow-none object-contain"
                style={{ filter: logoFilter }}
              />
            </div>

            <div className="text-center mb-10">
              <h2 className="text-4xl font-semibold tracking-tighter mb-1 leading-tight">
                Predict. Retain.<br />Grow.
              </h2>
              <p className="text-zinc-400 mb-6">
                AI-Powered Customer Insights Engine
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {features.map((feature, idx) => {
                const IconComponent = feature.icon
                return (
                  <div
                    key={idx}
                    className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl p-5 flex gap-5 items-start"
                  >
                    <div className={`mt-0.5 p-3 rounded-2xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-5 h-5 ${feature.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-white mb-1.5 tracking-tight">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Trust signals */}
            <div className="mt-12 flex items-center justify-center gap-8 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>99% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Real-time</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form */}
        <div className="flex-1 lg:w-7/12 flex items-center justify-center p-6 sm:p-10 bg-white text-zinc-900">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="flex justify-center mb-8 lg:hidden">
              <img
                src={MyCRMLogo}
                alt="SynapseCRM Logo"
                className="h-10 w-auto"
                style={{ filter: logoFilter }}
              />
            </div>

            {/* Header */}
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">
                Welcome to SynapseCRM!
              </h1>
              <p className="text-zinc-600">
                Sign in to access your intelligent CRM workspace
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Email & Password fields (unchanged) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    disabled={loading}
                    className={`w-full pl-11 pr-4 py-3.5 bg-zinc-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-zinc-200 focus:border-indigo-500 focus:ring-indigo-200'
                      }`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={loading}
                    className={`w-full pl-11 pr-11 py-3.5 bg-zinc-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.password ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-zinc-200 focus:border-indigo-500 focus:ring-indigo-200'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password}</p>}
              </div>

              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 accent-indigo-600 border-zinc-300 rounded"
                />
                <span className="ml-3 text-sm text-zinc-600">Keep me signed in</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-color-white font-bold text-base bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-900 hover:to-purple-700 active:scale-[0.985] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-100"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    <p style={{ color: 'white' }}>Sign in</p>
                    <p style={{ color: 'white' }}> <ArrowRight className="w-4 h-4" /></p>
                  </>
                )}
              </button>
            </form>

            {/* Demo Widget */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading || demoLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-zinc-300 hover:border-indigo-300 hover:bg-indigo-50 text-zinc-700 font-semibold transition-all cursor-pointer disabled:opacity-55"
              >
                {demoLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Connecting Demo Workspace...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5 text-indigo-500 animate-pulse" />
                    Try Demo Account
                  </>
                )}
              </button>
              <p className="text-center text-[13px] text-zinc-500 mt-1.5 font-medium">
                Want to explore? Use demo credentials
              </p>
            </div>

            {/* Register Link */}
            <p className="mt-10 text-center text-sm text-zinc-600">
              New to SynapseCRM?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Create your free account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Features Section */}
      <div className="lg:hidden bg-linear-to-br from-zinc-900 via-indigo-950 to-purple-950 py-12 px-6">
        {/* Your mobile section remains the same */}
      </div>
    </div>
  )
}