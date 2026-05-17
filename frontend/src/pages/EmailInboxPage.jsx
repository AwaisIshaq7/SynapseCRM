import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, RefreshCw, Send, Inbox, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { emailApi } from '../api/emailApi'
import { customersApi } from '../api/customersApi'
import Breadcrumbs from '../components/hci/Breadcrumbs'
import LoadingSpinner from '../components/LoadingSpinner'
import SentimentBadge from '../components/SentimentBadge'
import PriorityBadge from '../components/PriorityBadge'
import { getEmailBody, getEmailSubject, getPreviewLine } from '../utils/emailHelpers'
import { formatDate, timeAgo } from '../utils/formatters'

export default function EmailInboxPage() {
  const [searchParams] = useSearchParams()
  const customerFilter = searchParams.get('customer')

  const [emails, setEmails] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [config, setConfig] = useState(null)

  const loadMailbox = useCallback(async () => {
    try {
      const params = customerFilter ? { customerId: customerFilter } : {}
      const res = await emailApi.getMailbox(params)
      if (res.data.success) {
        setEmails(res.data.data)
        setSelected((prev) => {
          if (!prev) return res.data.data[0] || null
          return res.data.data.find((e) => e._id === prev._id) || res.data.data[0] || null
        })
      }
    } catch {
      toast.error('Failed to load emails')
    } finally {
      setLoading(false)
    }
  }, [customerFilter])

  useEffect(() => {
    loadMailbox()
    emailApi.getConfigStatus().then((r) => r.data.success && setConfig(r.data.data)).catch(() => {})
  }, [loadMailbox])

  useEffect(() => {
    const interval = setInterval(loadMailbox, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadMailbox])

  useEffect(() => {
    if (selected) {
      const sub = getEmailSubject(selected)
      setReplySubject(sub.startsWith('Re:') ? sub : `Re: ${sub}`)
      setReplyText('')
    }
  }, [selected?._id])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await emailApi.sync({ limit: 200, sinceDays: 180 })
      if (res.data.success) {
        toast.success(res.data.data.message)
        await loadMailbox()
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleSuggest = async () => {
    if (!selected?.customerId?._id && !selected?.customerId) return
    const cid = selected.customerId._id || selected.customerId
    setSuggestLoading(true)
    try {
      const res = await customersApi.getSuggestedResponse(cid)
      if (res.data.success) setReplyText(res.data.data.suggestedReply)
    } catch {
      toast.error('Could not generate suggestion')
    } finally {
      setSuggestLoading(false)
    }
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!selected || !replyText.trim()) return
    setSending(true)
    try {
      const res = await emailApi.reply({
        interactionId: selected._id,
        message: replyText.trim(),
        subject: replySubject,
      })
      if (res.data.success) {
        toast.success(res.data.data.message)
        setReplyText('')
        await loadMailbox()
        setSelected(res.data.data.interaction)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const customer = selected?.customerId

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Email inbox' },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-7 h-7 text-indigo-600" />
            Email inbox
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Two-panel view — click an email to read · reply sends to customer&apos;s real address
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary inline-flex items-center gap-2"
        >
          {syncing ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
          Sync all emails
        </button>
      </div>

      {config && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
          <strong className="text-slate-800 dark:text-slate-200">Keys in use:</strong>{' '}
          Gmail SMTP/IMAP ({config.imapUser || 'not set'}) —{' '}
          {config.smtpConfigured ? '✅ connected' : '❌ missing SMTP_USER / SMTP_PASS'} ·{' '}
          Groq AI — {config.groqConfigured ? '✅ active' : '⚠️ not set (template replies only)'} ·{' '}
          Auto-sync every 5 min when backend is running
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-4">
        {/* Left — email list */}
        <div className="card flex flex-col min-h-0 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 font-medium text-sm text-gray-700 dark:text-gray-300">
            {emails.length} email{emails.length !== 1 ? 's' : ''}
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <Mail className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No emails yet. Click &quot;Sync all emails&quot; to import from Gmail.</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {emails.map((item) => {
                const isActive = selected?._id === item._id
                const c = item.customerId
                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={clsx(
                        'w-full text-left px-4 py-3 transition-colors',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.emailDirection === 'outbound' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {c?.name || item.emailFrom}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {getEmailSubject(item)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{getPreviewLine(item)}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <SentimentBadge label={item.sentimentLabel} size="xs" />
                        <PriorityBadge priority={item.priority} size="xs" />
                        <span className="text-[10px] text-gray-400 ml-auto">{timeAgo(item.date)}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Right — reader + reply */}
        <div className="card flex flex-col min-h-0 p-0 overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-8">
              Select an email to read
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {getEmailSubject(selected)}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selected.emailDirection === 'outbound' ? 'To' : 'From'}:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {selected.emailDirection === 'outbound' ? selected.emailTo : selected.emailFrom}
                      </span>
                      {customer && (
                        <>
                          {' · '}
                          <Link to={`/customers/${customer._id}`} className="text-indigo-600 hover:underline">
                            {customer.name}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(selected.date)}</p>
                  </div>
                  <div className="flex gap-2">
                    <SentimentBadge label={selected.sentimentLabel} size="sm" />
                    <PriorityBadge priority={selected.priority} size="sm" />
                  </div>
                </div>
                {selected.emailInsight && (
                  <p className="mt-3 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                    {selected.emailInsight}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {getEmailBody(selected) || '(empty message)'}
                </pre>
              </div>

              {selected.emailDirection !== 'outbound' && (
                <form
                  onSubmit={handleSendReply}
                  className="shrink-0 border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/80 dark:bg-gray-800/30 space-y-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reply via Gmail</p>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="input text-sm"
                    placeholder="Subject"
                  />
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input text-sm min-h-[120px] resize-y"
                    placeholder="Write your reply…"
                    required
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggestLoading}
                      className="btn-secondary text-sm"
                    >
                      {suggestLoading ? '…' : 'Suggest reply'}
                    </button>
                    <button type="submit" disabled={sending} className="btn-primary text-sm inline-flex items-center gap-2 ml-auto">
                      {sending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                      Send to {customer?.email || selected.emailFrom}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
