import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { customersApi } from '../api/customersApi'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUSES  = ['active', 'inactive', 'at_risk']
const EMPTY_FORM = { name: '', email: '', phone: '', company: '', status: 'active' }

export default function CustomerFormPage() {
  const { id }     = useParams()           // If id exists → edit mode
  const navigate   = useNavigate()
  const isEdit     = Boolean(id)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(isEdit) // true while fetching existing data
  const [saving,   setSaving]   = useState(false)

  // Fetch existing customer data in edit mode
  useEffect(() => {
    if (!isEdit) return
    const fetch = async () => {
      try {
        const res = await customersApi.getById(id)
        if (res.data.success) {
          const c = res.data.data
          setFormData({
            name: c.name || '', email: c.email || '',
            phone: c.phone || '', company: c.company || '', status: c.status || 'active',
          })
        }
      } catch { toast.error('Failed to load customer data') }
      finally { setLoading(false) }
    }
    fetch()
  }, [id, isEdit])

  const validate = () => {
    const errs = {}
    if (!formData.name.trim())                       errs.name    = 'Name is required'
    if (!formData.email)                             errs.email   = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email))  errs.email   = 'Enter a valid email'
    if (!formData.company.trim())                    errs.company = 'Company is required'
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
    setSaving(true)
    try {
      const res = isEdit
        ? await customersApi.update(id, formData)
        : await customersApi.create(formData)
      if (res.data.success) {
        toast.success(isEdit ? 'Customer updated ✅' : 'Customer added ✅')
        navigate(isEdit ? `/customers/${id}` : '/customers')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <li><Link to="/customers" className="hover:text-brand-600">Customers</Link></li>
          <li>›</li>
          <li className="font-medium text-gray-900 dark:text-white">{isEdit ? 'Edit Customer' : 'Add Customer'}</li>
        </ol>
      </nav>

      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {isEdit ? 'Edit Customer' : 'Add New Customer'}
        </h1>

        <form onSubmit={handleSubmit} noValidate aria-label={isEdit ? 'Edit customer form' : 'Add customer form'}>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">Full Name *</label>
              <input id="name" name="name" type="text" value={formData.name}
                onChange={handleChange} className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Sarah Ahmed" disabled={saving} aria-invalid={!!errors.name} />
              {errors.name && <p className="mt-1 text-xs text-red-600" role="alert">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email Address *</label>
              <input id="email" name="email" type="email" value={formData.email}
                onChange={handleChange} className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="sarah@company.com" disabled={saving} aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 text-xs text-red-600" role="alert">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">Phone Number</label>
              <input id="phone" name="phone" type="tel" value={formData.phone}
                onChange={handleChange} className="input"
                placeholder="+92-300-1234567" disabled={saving} />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="label">Company *</label>
              <input id="company" name="company" type="text" value={formData.company}
                onChange={handleChange} className={`input ${errors.company ? 'border-red-500' : ''}`}
                placeholder="Acme Corp" disabled={saving} aria-invalid={!!errors.company} />
              {errors.company && <p className="mt-1 text-xs text-red-600" role="alert">{errors.company}</p>}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="label">Customer Status</label>
              <select id="status" name="status" value={formData.status}
                onChange={handleChange} className="input" disabled={saving}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s === 'at_risk' ? 'At Risk' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link to={isEdit ? `/customers/${id}` : '/customers'} className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <><LoadingSpinner size="sm" /><span>Saving...</span></> : (isEdit ? 'Save Changes' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}