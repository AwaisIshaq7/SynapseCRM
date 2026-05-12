import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const { login, loginAsDemo } = useAuth()
  const navigate  = useNavigate()

  const validate = () => {
    const errs = {}
    if (!formData.email)                              errs.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email))   errs.email    = 'Enter a valid email'
    if (!formData.password)                           errs.password = 'Password is required'
    else if (formData.password.length < 6)            errs.password = 'Password must be at least 6 characters'
    return errs
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    // Clear error on change — Nielsen heuristic: error prevention
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
      // Handle Render cold start — show friendly message
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error('Server is waking up (free tier). Please try again in a moment.')
      } else {
        toast.error('Connection failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAccess = () => {
    setErrors({})
    loginAsDemo()
    toast.success('Entered demo workspace')
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      {/* Enhanced gradient orbs with increased visibility */}
      <div className="auth-orb h-80 w-80 bg-brand-500/40 animate-float" style={{ left: '-8rem', top: '-6rem' }} aria-hidden="true" />
      <div className="auth-orb h-96 w-96 bg-cyan-400/30 animate-drift" style={{ right: '-6rem', top: '12%' }} aria-hidden="true" />
      <div className="auth-orb h-96 w-96 bg-emerald-400/25 animate-slow-pulse" style={{ bottom: '-7rem', left: '18%' }} aria-hidden="true" />
      <div className="auth-orb h-72 w-72 bg-brand-600/20 animate-float" style={{ right: '5%', bottom: '10%' }} aria-hidden="true" />

      {/* Enhanced gradient backdrop layers */}
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.92),rgba(15,23,42,0.82)_45%,rgba(37,99,235,0.18)_100%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.20),transparent_32%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.08),transparent_70%)]" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:flex lg:flex-col lg:gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 backdrop-blur">
            <SparklesIcon className="h-4 w-4" />
            Enterprise CRM Platform
          </div>
          <div>
            <h1 className="max-w-xl text-5xl font-semibold tracking-tight xl:text-6xl" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #c7d2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Customer intelligence, pipelines, and decisions in one secure workspace.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              SynapseCRM brings operational clarity to sales, support, and management with a polished interface built for daily enterprise use.
            </p>
          </div>

          <div className="grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              ['Unified view', 'Accounts, activity, and risk signals in one place.', 'from-blue-500/20 to-cyan-500/10'],
              ['Fast decisions', 'Shorten response time with clear prioritization.', 'from-purple-500/20 to-blue-500/10'],
              ['Secure access', 'Role-based screens and authenticated workflows.', 'from-emerald-500/20 to-teal-500/10'],
            ].map(([title, description, gradient]) => (
              <div key={title} className={`rounded-2xl border border-white/15 bg-linear-to-br ${gradient} p-4 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-linear-to-br`}>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="auth-panel p-6 text-slate-900 shadow-[0_35px_90px_-50px_rgba(15,23,42,0.9)] sm:p-8 dark:text-slate-100">
            {/* Enhanced gradient overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_32%)]" aria-hidden="true" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.03),transparent_50%)]" aria-hidden="true" />
            <div className="relative">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-brand-700 shadow-[0_18px_35px_-18px_rgba(37,99,235,0.95)]">
                    <span className="text-lg font-bold text-white">S</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">SynapseCRM</h1>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AI-Driven CRM Platform</p>
                  </div>
                </div>
                <div className="hidden rounded-full border border-emerald-200/70 bg-linear-to-r from-emerald-50 to-teal-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-linear-to-r dark:from-emerald-900/30 dark:to-teal-900/20 dark:text-emerald-300 sm:block">
                  Secure sign in
                </div>
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Sign in to continue to your customer workspace.</p>

              <form onSubmit={handleSubmit} noValidate aria-label="Login form" className="mt-8 space-y-4">
                <div>
                  <label htmlFor="email" className="label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    disabled={loading}
                  />
                  {errors.password && (
                    <p id="password-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-2 w-full"
                  aria-live="polite"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={handleDemoAccess}
                className="btn-secondary mt-3 w-full"
              >
                Open dashboard without login
              </button>

              <div className="mt-6 flex items-center justify-between gap-4 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    Create one
                  </Link>
                </p>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 md:flex">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
                  Enterprise security
                </div>
              </div>

              {demoMode && (
                <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <Link
                    to="/demo-dashboard"
                    className="btn-secondary w-full"
                  >
                    Open demo dashboard
                  </Link>
                  <p className="mt-2 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Temporary access for previewing the app before backend integration is complete.
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Enterprise-ready interface · SynapseCRM v1.0
          </p>
        </section>
      </div>
    </div>
  )
}