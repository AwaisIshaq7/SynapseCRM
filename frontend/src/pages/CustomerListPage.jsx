import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCustomers } from '../hooks/useCustomers'
import CustomerCard from '../components/CustomerCard'
import SkeletonLoader from '../components/SkeletonLoader'
import EmptyState from '../components/EmptyState'
import SentimentBadge from '../components/SentimentBadge'
import { getStatusClasses, getChurnRiskClasses, getSentimentClasses } from '../utils/sentimentUtils'
import { formatDate } from '../utils/formatters'
import { LayoutGrid, List, Eye, Trash2, Calendar } from 'lucide-react'
import clsx from 'clsx'
import Tooltip from '../components/Tooltip'
 

const STATUS_FILTERS = [
  { value: '', label: 'All Customers' },
  { value: 'active',   label: 'Active' },
  { value: 'at_risk',  label: 'At Risk' },
  { value: 'inactive', label: 'Inactive' },
]

export default function CustomerListPage() {
  const { isAdmin, isSalesManager, user } = useAuth()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  const { customers, loading, error, updateParams, deleteCustomer, pagination } = useCustomers()

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 rounded-2xl bg-linear-to-r from-blue-50/50 to-cyan-50/50 dark:from-slate-900/50 dark:to-slate-800/50 p-6">
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
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

          {/* View Mode Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-0.5 shrink-0 self-start sm:self-center ml-auto" role="group" aria-label="View mode">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid size={13} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List size={13} />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && <SkeletonLoader type={viewMode === 'grid' ? 'card' : 'table-row'} count={viewMode === 'grid' ? 8 : 6} className="mb-6" />}

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
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              role="list"
              aria-label="Customer list"
            >
              {customers.map(customer => (
                <div key={customer._id} role="listitem" className="relative group/item">
                  <CustomerCard customer={customer} />
                  {/* Delete button — only visible to admin on hover */}
                  {(isAdmin || (isSalesManager && customer.assignedTo?._id?.toString() === user?._id?.toString())) && (
                    <Tooltip content="Delete Customer" position="left">
                      <button
                        onClick={() => handleDelete(customer._id, customer.name)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-100 text-red-650
                                   hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400
                                   opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                        aria-label={`Delete ${customer.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </Tooltip>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sentiment</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Churn Risk</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Last Contact</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {customers.map(customer => {
                    const statusStyles = getStatusClasses(customer.status)
                    const churnStyles = getChurnRiskClasses(customer.churnScore)
                    const sentimentColors = getSentimentClasses(customer.overallSentiment)
                    return (
                      <tr key={customer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors group">
                        {/* Identity */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-xs",
                              sentimentColors.bg,
                              sentimentColors.text
                            )}>
                              {customer.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <Link to={`/customers/${customer._id}`} className="font-bold text-slate-850 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-sm">
                                {customer.name}
                              </Link>
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{customer.company || 'No Company'}</p>
                            </div>
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs space-y-0.5">
                          <p className="text-slate-700 dark:text-slate-300 font-semibold">{customer.email}</p>
                          {customer.phone && <p className="text-slate-450 dark:text-slate-550 font-medium">{customer.phone}</p>}
                        </td>
                        {/* Assigned to */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            👤 {customer.assignedTo?.name || 'Unassigned'}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            "inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs",
                            statusStyles.bg,
                            statusStyles.text
                          )}>
                            <span className={clsx(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              customer.status === 'active' ? 'bg-green-500 animate-pulse' :
                              customer.status === 'at_risk' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'
                            )} />
                            {customer.status === 'at_risk' ? 'At Risk' : customer.status}
                          </span>
                        </td>
                        {/* Sentiment */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <SentimentBadge label={customer.overallSentiment} size="xs" />
                        </td>
                        {/* Churn Risk */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs",
                            churnStyles.bg,
                            churnStyles.text
                          )}>
                            {churnStyles.label}
                          </span>
                        </td>
                        {/* Last Contact */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-bold">
                          {customer.lastContactDate ? formatDate(customer.lastContactDate) : 'No contact history'}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/customers/${customer._id}`}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-brand-200 bg-white text-slate-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-350 dark:hover:text-brand-400 transition shadow-xs"
                              title="View Profile Details"
                            >
                              <Eye size={14} />
                            </Link>
                            {(isAdmin || (isSalesManager && customer.assignedTo?._id?.toString() === user?._id?.toString())) && (
                              <button
                                onClick={() => handleDelete(customer._id, customer.name)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition cursor-pointer shadow-xs"
                                title="Delete Customer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Premium Pagination Component */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Showing page <strong className="text-slate-700 dark:text-slate-200">{pagination.page}</strong> of <strong className="text-slate-700 dark:text-slate-200">{pagination.totalPages}</strong> ({pagination.total} total customers)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateParams({ page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1)
                  .filter(p => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                  .map((p, idx, arr) => {
                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <div key={p} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-2 text-slate-400 font-medium">...</span>
                        )}
                        <button
                          onClick={() => updateParams({ page: p })}
                          className={`w-9 h-9 flex items-center justify-center text-sm font-bold rounded-xl transition-all ${
                            pagination.page === p
                              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    )
                  })}

                <button
                  onClick={() => updateParams({ page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}