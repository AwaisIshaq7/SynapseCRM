import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCustomer } from '../hooks/useCustomers'
import { customersApi } from '../api/customersApi'
import { interactionsApi } from '../api/interactionsApi'
import RAGChat from '../components/rag/RAGChat'
import SentimentBadge from '../components/SentimentBadge'
import PriorityBadge from '../components/PriorityBadge'
import EmailInsightPanel from '../components/EmailInsightPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { getStatusClasses, getChurnRiskClasses } from '../utils/sentimentUtils'
import { capitalize, formatDate } from '../utils/formatters'
import InteractionHistoryItem from '../components/InteractionHistoryItem'
import { Bot, Mail } from 'lucide-react'
import Breadcrumbs from '../components/hci/Breadcrumbs'
import ConfirmModal from '../components/hci/ConfirmModal'
import { storage } from '../utils/storage'

const INTERACTION_TYPES = ['call', 'email', 'meeting', 'note']

export default function CustomerDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { isAdmin, isSalesManager, user }  = useAuth()
  const { customer, loading, error, setCustomer } = useCustomer(id)

  const [interactions,      setInteractions]      = useState([])
  const [interactionsLoad,  setInteractionsLoad]  = useState(true)
  const [showAddForm,       setShowAddForm]        = useState(false)
  const [showRAG,           setShowRAG]            = useState(false)
  const [submitting,        setSubmitting]         = useState(false)
  const [confirmDelete,     setConfirmDelete]      = useState(false)
  const [deleteInteraction, setDeleteInteraction]  = useState(null)
  const [newInteraction,    setNewInteraction]     = useState({
    type: 'call', content: '', date: new Date().toISOString().split('T')[0]
  })

  // Fetch interactions
  useEffect(() => {
    if (!id) return
    const fetchInteractions = async () => {
      try {
        const res = await interactionsApi.getByCustomer(id)
        if (res.data.success) setInteractions(res.data.data)
      } catch {
        // Silent fail — interactions are not critical
      } finally {
        setInteractionsLoad(false)
      }
    }
    fetchInteractions()
  }, [id])

  useEffect(() => {
    if (customer) storage.addRecentCustomer(customer)
  }, [customer])

  const handleAddInteraction = async (e) => {
    e.preventDefault()
    if (!newInteraction.content.trim()) {
      toast.error('Please enter interaction content')
      return
    }
    setSubmitting(true)
    try {
      const res = await interactionsApi.create(id, newInteraction)
      if (res.data.success) {
        setInteractions(prev => [res.data.data, ...prev])
        setNewInteraction({ type: 'call', content: '', date: new Date().toISOString().split('T')[0] })
        setShowAddForm(false)
        toast.success('Interaction logged')

        // ⭐ Sentiment drop alert — Week 6 requirement
        const sentimentScore = res.data.data?.sentimentScore
        if (sentimentScore !== null && sentimentScore !== undefined && sentimentScore < -0.5) {
          toast.error(`⚠️ Negative sentiment detected (score: ${sentimentScore.toFixed(2)}). Consider following up urgently.`, {
            duration: 6000,
          })
        }
      }
    } catch {
      toast.error('Failed to log interaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteInteraction = async () => {
    if (!deleteInteraction) return
    try {
      await interactionsApi.delete(deleteInteraction)
      setInteractions((prev) => prev.filter((i) => i._id !== deleteInteraction))
      toast.success('Interaction deleted')
    } catch {
      toast.error('Failed to delete interaction')
    } finally {
      setDeleteInteraction(null)
    }
  }

  const handleDeleteCustomer = async () => {
    try {
      await customersApi.delete(id)
      toast.success('Customer deleted')
      navigate('/customers')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setConfirmDelete(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (error) return (
    <div className="card text-center py-12 max-w-md mx-auto">
      <p className="text-red-600 font-medium">Customer not found</p>
      <Link to="/customers" className="btn-secondary mt-4 inline-block">← Back to Customers</Link>
    </div>
  )

  if (!customer) return null

  const statusStyles = getStatusClasses(customer.status)
  const churnStyles  = getChurnRiskClasses(customer.churnScore)

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Customers', to: '/customers' },
          { label: customer.name },
        ]}
      />

      {/* Customer header card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
              <span className="text-brand-700 dark:text-brand-300 font-bold text-2xl">
                {customer.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">{customer.company}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', statusStyles.bg, statusStyles.text)}>
                  {capitalize(customer.status)}
                </span>
                <SentimentBadge label={customer.overallSentiment} size="xs" />
                <PriorityBadge priority={customer.priority} score={customer.priorityScore} size="xs" />
                <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', churnStyles.bg)}>
                  <span className={churnStyles.text}>Churn: {churnStyles.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <Link
              to={`/emails?customer=${id}`}
              className="btn-secondary text-sm inline-flex items-center gap-2"
            >
              <Mail size={16} />
              Email inbox
            </Link>
            <button
              onClick={() => setShowRAG(true)}
              className="btn-secondary text-sm inline-flex items-center gap-2"
            >
              <Bot size={16} />
              Ask AI Assistant
            </button>
            <Link to={`/customers/${id}/edit`} className="btn-secondary text-sm">
              ✏️ Edit
            </Link>
            {(isAdmin || (isSalesManager && customer.assignedTo?._id?.toString() === user?._id?.toString())) && (
              <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger text-sm">
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Contact details grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
          {[
            { label: 'Email',        value: customer.email },
            { label: 'Phone',        value: customer.phone || '—' },
            { label: 'Last Contact', value: formatDate(customer.lastContactDate) },
            { label: 'Churn Score',  value: customer.churnScore != null ? `${(customer.churnScore * 100).toFixed(0)}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <EmailInsightPanel
        customer={customer}
        interactions={interactions}
        onAnalyzed={(updated) => updated && setCustomer(updated)}
      />

      {/* Interactions section */}
      <div className="card !p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interaction History
            <span className="ml-2 text-sm font-normal text-gray-500">({interactions.length})</span>
          </h2>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="btn-primary text-sm"
            aria-expanded={showAddForm}
          >
            {showAddForm ? '✕ Cancel' : '+ Log Interaction'}
          </button>
        </div>

        {/* Add interaction form */}
        {showAddForm && (
          <form
            onSubmit={handleAddInteraction}
            className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-2 animate-slide-in"
            aria-label="Add new interaction"
          >
            <div className="flex gap-2">
              {/* Type */}
              <div className="w-36">
                <label htmlFor="int-type" className="label !mb-0.5 text-xs">Type</label>
                <select
                  id="int-type"
                  value={newInteraction.type}
                  onChange={e => setNewInteraction(p => ({ ...p, type: e.target.value }))}
                  className="input"
                >
                  {INTERACTION_TYPES.map(t => (
                    <option key={t} value={t}>{capitalize(t)}</option>
                  ))}
                </select>
              </div>
              {/* Date */}
              <div className="flex-1">
                <label htmlFor="int-date" className="label !mb-0.5 text-xs">Date</label>
                <input
                  id="int-date"
                  type="date"
                  value={newInteraction.date}
                  onChange={e => setNewInteraction(p => ({ ...p, date: e.target.value }))}
                  className="input"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            {/* Content */}
            <div>
              <label htmlFor="int-content" className="label !mb-0.5 text-xs">Notes / Summary</label>
              <textarea
                id="int-content"
                value={newInteraction.content}
                onChange={e => setNewInteraction(p => ({ ...p, content: e.target.value }))}
                className="input resize-none !py-2"
                rows={2}
                placeholder="Describe what was discussed, any concerns, next steps..."
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <LoadingSpinner size="sm" /> : 'Log Interaction'}
              </button>
            </div>
          </form>
        )}

        {/* Interactions list */}
        {interactionsLoad ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : interactions.length === 0 ? (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500">
            <p className="text-2xl mb-1">💬</p>
            <p className="text-sm">No interactions yet. Log the first one above.</p>
          </div>
        ) : (
          <ol className="space-y-2 list-none p-0 m-0" aria-label="Interaction history">
            {interactions.map((interaction) => (
              <InteractionHistoryItem
                key={interaction._id}
                interaction={interaction}
                canDelete={
                  isAdmin ||
                  (isSalesManager &&
                    (interaction.userId?._id?.toString?.() || interaction.userId?.toString()) ===
                      user?._id?.toString())
                }
                onDelete={setDeleteInteraction}
              />
            ))}
          </ol>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Curious why churn spiked?{' '}
        <Link to="/reports" className="text-brand-600 hover:underline font-medium">
          Explore churn trends in Reports →
        </Link>
      </p>

      {showRAG && (
        <RAGChat
          customerId={customer._id}
          customerName={customer.name}
          onClose={() => setShowRAG(false)}
        />
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteCustomer}
        title="Delete customer?"
        message="This cannot be undone. All interactions will be removed."
        confirmLabel="Delete"
        variant="danger"
      />
      <ConfirmModal
        isOpen={!!deleteInteraction}
        onClose={() => setDeleteInteraction(null)}
        onConfirm={handleDeleteInteraction}
        title="Delete interaction?"
        message="Remove this entry from the timeline?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}