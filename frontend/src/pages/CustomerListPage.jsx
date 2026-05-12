import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCustomers } from '../hooks/useCustomers'
import CustomerCard from '../components/CustomerCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
 

const STATUS_FILTERS = [
  { value: '', label: 'All Customers' },
  { value: 'active',   label: 'Active' },
  { value: 'at_risk',  label: 'At Risk' },
  { value: 'inactive', label: 'Inactive' },
]

export default function CustomerListPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { customers, loading, error, updateParams, deleteCustomer } = useCustomers()

  // Debounced search — don't hit API on every keystroke
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchQuery(searchInput)
    updateParams({ search: searchInput, status: statusFilter })
  }

  const handleStatusChange = (status) => {
    setStatusFilter(status)
    updateParams({ search: searchQuery, status })
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
    await deleteCustomer(id)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Loading...' : `${customers.length} customer${customers.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <Link to="/customers/new" className="btn-primary">
          + Add Customer
        </Link>
      </div>

      {/* Search + Filter bar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1" role="search">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, company..."
                className="input pl-9"
                aria-label="Search customers"
              />
            </div>
            <button type="submit" className="btn-primary px-4">Search</button>
          </form>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => handleStatusChange(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-pressed={statusFilter === f.value}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && !loading && (
        <div className="card text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-medium">⚠️ {error}</p>
          <p className="text-sm text-gray-500 mt-2">
            The backend might be starting up. Please wait a moment and refresh.
          </p>
        </div>
      )}

      {!loading && !error && customers.length === 0 && (
        <EmptyState
          icon="👥"
          title="No customers found"
          message={searchQuery || statusFilter
            ? "Try adjusting your search or filters"
            : "Add your first customer to get started"
          }
          action={{ label: '+ Add Customer', onClick: () => navigate('/customers/new') }}
        />
      )}

      {!loading && !error && customers.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          role="list"
          aria-label="Customer list"
        >
          {customers.map(customer => (
            <div key={customer._id} role="listitem" className="relative group/item">
              <CustomerCard customer={customer} />
              {/* Delete button — only visible to admin on hover */}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(customer._id, customer.name)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-100 text-red-600
                             hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400
                             opacity-0 group-hover/item:opacity-100 transition-opacity"
                  aria-label={`Delete ${customer.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}