import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { customersApi } from '../api/customersApi'
import LoadingSpinner from '../components/LoadingSpinner'
import Breadcrumbs from '../components/hci/Breadcrumbs'
import StepIndicator from '../components/hci/StepIndicator'
import FieldHelp from '../components/hci/FieldHelp'
import toast from 'react-hot-toast'
import { storage } from '../utils/storage'

const STATUSES = ['active', 'inactive', 'at_risk']
const EMPTY_FORM = { name: '', email: '', phone: '', company: '', status: 'active' }
const FORM_STEPS = [
  { id: 'contact', label: 'Contact' },
  { id: 'company', label: 'Company & status' },
]

export default function CustomerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState(() => (!isEdit && storage.getCustomerDraft()) || EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const currentStep =
    formData.name.trim() && formData.email.trim() ? 1 : 0

  useEffect(() => {
    if (!isEdit) storage.setCustomerDraft(formData)
  }, [formData, isEdit])

  useEffect(() => {
    if (!isEdit) return
    const fetch = async () => {
      try {
        const res = await customersApi.getById(id)
        if (res.data.success) {
          const c = res.data.data
          setFormData({
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            status: c.status || 'active',
          })
        }
      } catch {
        toast.error('Failed to load customer data')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, isEdit])

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Name is required'
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.company.trim()) errs.company = 'Company is required'
    return errs
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setSaving(true)
    try {
      const res = isEdit
        ? await customersApi.update(id, formData)
        : await customersApi.create(formData)
      if (res.data.success) {
        if (!isEdit) storage.setCustomerDraft(null)
        toast.success(isEdit ? 'Customer updated' : 'Customer added')
        navigate(isEdit ? `/customers/${id}` : '/customers')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Customers', to: '/customers' },
          { label: isEdit ? 'Edit' : 'Add' },
        ]}
      />

      {!isEdit && (
        <p className="text-xs text-gray-500 mb-4 -mt-2">
          Draft saved automatically — close and return anytime (reentrance).
        </p>
      )}

      <StepIndicator steps={FORM_STEPS} currentStep={currentStep} />

      <div className="card">
        <div className="form-header-diagonal mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label inline-flex items-center">
                Full Name *
                <FieldHelp text="Primary contact name shown on cards and alerts." />
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Sarah Ahmed"
                disabled={saving}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600" role="alert">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="label inline-flex items-center">
                Email *
                <FieldHelp text="Used for outreach and duplicate detection." />
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="sarah@company.com"
                disabled={saving}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600" role="alert">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" name="phone" type="tel" value={formData.phone}
                onChange={handleChange} className="input" placeholder="+92-300-1234567" disabled={saving} />
            </div>

            <div>
              <label htmlFor="company" className="label inline-flex items-center">
                Company *
                <FieldHelp text="Account or organization this contact belongs to." />
              </label>
              <input id="company" name="company" type="text" value={formData.company}
                onChange={handleChange} className={`input ${errors.company ? 'border-red-500' : ''}`}
                placeholder="Acme Corp" disabled={saving} />
              {errors.company && <p className="mt-1 text-xs text-red-600" role="alert">{errors.company}</p>}
            </div>

            <div>
              <label htmlFor="status" className="label">Customer Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className="input" disabled={saving}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s === 'at_risk' ? 'At Risk' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link to={isEdit ? `/customers/${id}` : '/customers'} className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <><LoadingSpinner size="sm" /><span>Saving...</span></> : (isEdit ? 'Save Changes' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

