import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

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
      const { confirmPassword, ...submitData } = formData
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SynapseCRM</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create account</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Join SynapseCRM to manage your customers</p>

          <form onSubmit={handleSubmit} noValidate aria-label="Registration form">
            {/* Full Name */}
            <div className="mb-4">
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" name="name" type="text" autoComplete="name"
                value={formData.name} onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Sarah Ahmed" disabled={loading}
                aria-invalid={!!errors.name} />
              {errors.name && <p className="mt-1 text-xs text-red-600" role="alert">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email"
                value={formData.email} onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="you@company.com" disabled={loading}
                aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 text-xs text-red-600" role="alert">{errors.email}</p>}
            </div>

            {/* Role selector */}
            <div className="mb-4">
              <label htmlFor="role" className="label">Role</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange}
                className="input" disabled={loading}>
                <option value="sales_manager">Sales Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password"
                value={formData.password} onChange={handleChange}
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Minimum 6 characters" disabled={loading}
                aria-invalid={!!errors.password} />
              {errors.password && <p className="mt-1 text-xs text-red-600" role="alert">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
                value={formData.confirmPassword} onChange={handleChange}
                className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Re-enter password" disabled={loading}
                aria-invalid={!!errors.confirmPassword} />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600" role="alert">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading ? <><LoadingSpinner size="sm" /><span>Creating account...</span></> : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}