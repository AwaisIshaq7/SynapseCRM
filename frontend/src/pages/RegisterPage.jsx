import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import Logo from '../components/Logo'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'sales_manager'
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    if (!formData.name.trim())                        errs.name            = 'Full name is required'
    if (!formData.email)                              errs.email           = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email))   errs.email           = 'Enter a valid email'
    if (!formData.password)                           errs.password        = 'Password is required'
    else if (formData.password.length < 6)            errs.password        = 'Minimum 6 characters'
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setLoading(true)
    try {
      const submitData = { ...formData }
      delete submitData.confirmPassword
      const result = await register(submitData)
      if (result.success) {
        toast.success('Account created successfully! 🚀')
        navigate('/dashboard', { replace: true })
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch {
      toast.error('Connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="auth-orb h-72 w-72 bg-brand-500/30 animate-float" style={{ left: '-8rem', top: '-5rem' }} aria-hidden="true" />
      <div className="auth-orb h-80 w-80 bg-emerald-400/15 animate-drift" style={{ right: '-6rem', bottom: '-5rem' }} aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.94),rgba(15,23,42,0.84)_50%,rgba(37,99,235,0.16)_100%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_28%)]" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:flex lg:flex-col lg:gap-6">
          <Logo size="normal" />
          <div className="max-w-xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.85)] backdrop-blur" style={{ borderRadius: '2rem' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">Create your workspace</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Launch a secure, modern CRM workspace in minutes.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Create an account to access dashboards, customer management, analytics, and operational tools designed for enterprise workflows.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ['Role aware', 'Admin and sales manager access with tailored screens.'],
                ['Production ready', 'Authentication, persistence, and polished UI patterns.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="auth-panel p-6 text-slate-900 shadow-[0_35px_90px_-50px_rgba(15,23,42,0.9)] sm:p-8 dark:text-slate-100">
            <div className="relative">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 shadow-[0_18px_35px_-18px_rgba(37,99,235,0.9)]">
                  <span className="text-lg font-bold text-white">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">SynapseCRM</h1>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Account setup</p>
                </div>
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Create account</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Join SynapseCRM to manage customers with a polished enterprise interface.</p>

              <form onSubmit={handleSubmit} noValidate aria-label="Registration form" className="mt-8 space-y-4">
                <div>
                  <label htmlFor="name" className="label">Full name</label>
                  <input id="name" name="name" type="text" autoComplete="name"
                    value={formData.name} onChange={handleChange}
                    className={`input ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Sarah Ahmed" disabled={loading}
                    aria-invalid={!!errors.name} />
                  {errors.name && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="label">Email address</label>
                  <input id="email" name="email" type="email" autoComplete="email"
                    value={formData.email} onChange={handleChange}
                    className={`input ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="you@company.com" disabled={loading}
                    aria-invalid={!!errors.email} />
                  {errors.email && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="role" className="label">Role</label>
                  <select id="role" name="role" value={formData.role} onChange={handleChange}
                    className="input" disabled={loading}>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="password" className="label">Password</label>
                  <input id="password" name="password" type="password" autoComplete="new-password"
                    value={formData.password} onChange={handleChange}
                    className={`input ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Minimum 6 characters" disabled={loading}
                    aria-invalid={!!errors.password} />
                  {errors.password && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">Confirm password</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
                    value={formData.confirmPassword} onChange={handleChange}
                    className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Re-enter password" disabled={loading}
                    aria-invalid={!!errors.confirmPassword} />
                  {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">{errors.confirmPassword}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary mt-2 w-full">
                  {loading ? <><LoadingSpinner size="sm" /><span>Creating account...</span></> : <><span>Create account</span><ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}