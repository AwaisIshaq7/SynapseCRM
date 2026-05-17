import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCustomers } from '../hooks/useCustomers'
import { customersApi } from '../api/customersApi'
import CustomerCard from '../components/CustomerCard'
import SkeletonLoader from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'
import Breadcrumbs from '../components/hci/Breadcrumbs'
import ConfirmModal from '../components/hci/ConfirmModal'
import CustomerPreviewPanel from '../components/hci/CustomerPreviewPanel'
import { storage } from '../utils/storage'

const STATUS_FILTERS = [
  { value: '', label: 'All Customers' },
  { value: 'active', label: 'Active' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'inactive', label: 'Inactive' },
]

export default function CustomerListPage() {
  const { isAdmin, isSalesManager, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const saved = storage.getCustomerFilters()
  const [searchInput, setSearchInput] = useState(saved?.searchInput ?? '')
  const [statusFilter, setStatusFilter] = useState(saved?.statusFilter ?? '')
  const [searchQuery, setSearchQuery] = useState(saved?.searchQuery ?? '')

  const selectedId = searchParams.get('selected')
  const [previewCustomer, setPreviewCustomer] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { customers, loading, error, updateParams, deleteCustomer } = useCustomers()

  // Reentrance — restore filters to API on mount
  useEffect(() => {
    if (saved?.searchQuery || saved?.statusFilter) {
      updateParams({ search: saved.searchQuery || '', status: saved.statusFilter || '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Instant gratification — live search (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput)
      updateParams({ search: searchInput, status: statusFilter })
      storage.setCustomerFilters({ searchInput, searchQuery: searchInput, statusFilter })
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput, statusFilter, updateParams])

  const handleStatusChange = (status) => {
    setStatusFilter(status)
  }

  const selectCustomer = useCallback((id) => {
    setSearchParams(id ? { selected: id } : {})
    if (!id) {
      setPreviewCustomer(null)
      return
    }
    setPreviewLoading(true)
    customersApi
      .getById(id)
      .then((res) => {
        if (res.data.success) setPreviewCustomer(res.data.data)
      })
      .catch(() => setPreviewCustomer(null))
      .finally(() => setPreviewLoading(false))
  }, [setSearchParams])

  useEffect(() => {
    if (selectedId) selectCustomer(selectedId)
    else setPreviewCustomer(null)
  }, [selectedId, selectCustomer])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteCustomer(deleteTarget.id)
    if (selectedId === deleteTarget.id) selectCustomer(null)
    setDeleteTarget(null)
  }

  const handleCardClick = (customer, e) => {
    if (window.matchMedia('(min-width: 1280px)').matches) {
      e.preventDefault()
      selectCustomer(customer._id)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Customers' }]} />

      <div className="form-header-diagonal mb-6 rounded-2xl bg-linear-to-r from-blue-50/50 to-cyan-50/50 dark:from-slate-900/50 dark:to-slate-800/50 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? 'Loading...' : `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
            <span className="hidden xl:inline text-gray-400"> · Select a row to preview (two-panel)</span>
          </p>
        </div>
        <Link to="/customers/new" className="btn-primary shrink-0 self-end sm:self-auto">
          + Add Customer
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1" role="search">
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
              placeholder="Search as you type..."
              className="input pl-9"
              aria-label="Search customers"
            />
          </div>

          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleStatusChange(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
                aria-pressed={statusFilter === f.value}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="xl:grid xl:grid-cols-2 xl:gap-4 xl:items-start">
        <section className="flex flex-col min-h-0 min-w-0 overflow-y-auto pr-1" aria-label="Customer list">
          {loading && <SkeletonLoader type="card" count={3} className="space-y-4 mb-6" />}

          {error && !loading && (
            <div className="card text-center py-12">
              <p className="text-red-600 dark:text-red-400 font-medium">⚠️ {error}</p>
            </div>
          )}

          {!loading && !error && customers.length === 0 && (
            <EmptyState
              icon="👥"
              title="No customers found"
              message={searchQuery || statusFilter ? 'Try adjusting your search or filters' : 'Add your first customer to get started'}
              action={{ label: '+ Add Customer', onClick: () => navigate('/customers/new') }}
            />
          )}

          {!loading && !error && customers.length > 0 && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-1 gap-4 auto-rows-fr"
              role="list"
            >
              {customers.map((customer) => {
                const canDelete =
                  isAdmin ||
                  (isSalesManager &&
                    customer.assignedTo?._id?.toString() === user?._id?.toString())
                return (
                  <div key={customer._id} role="listitem" className="h-full">
                    <CustomerCard
                      customer={customer}
                      isSelected={selectedId === customer._id}
                      onCardClick={handleCardClick}
                      onDelete={
                        canDelete
                          ? (c) => setDeleteTarget({ id: c._id, name: c.name })
                          : undefined
                      }
                    />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <aside className="hidden xl:block xl:sticky xl:top-4" aria-label="Customer preview">
          <CustomerPreviewPanel
            customer={previewCustomer}
            loading={previewLoading && !!selectedId}
            onClose={() => selectCustomer(null)}
          />
        </aside>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete customer?"
        message={deleteTarget ? `Delete ${deleteTarget.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}



