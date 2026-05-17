import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Mail, RefreshCw, Send, Inbox, ArrowDownLeft, ArrowUpRight,
  Sparkles, User, Calendar, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { emailApi } from '../api/emailApi'
import { customersApi } from '../api/customersApi'
import Breadcrumbs from '../components/hci/Breadcrumbs'
import LoadingSpinner from '../components/LoadingSpinner'
import SentimentBadge from '../components/SentimentBadge'
import PriorityBadge from '../components/PriorityBadge'
import {
  getEmailBody, getEmailSubject, getPreviewLine, getSenderLabel,
} from '../utils/emailHelpers'
import { formatDate, timeAgo } from '../utils/formatters'

const MAILBOX_LIMIT = 150

export default function EmailInboxPage() {
  const [searchParams] = useSearchParams()
  const customerFilter = searchParams.get('customer')

  const [emails, setEmails] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadMailbox = useCallback(async () => {
    try {
      const params = {
        limit: MAILBOX_LIMIT,
        ...(customerFilter ? { customerId: customerFilter } : {}),
      }
      const res = await emailApi.getMailbox(params)
      if (res.data.success) {
        const list = res.data.data || []
        setEmails(list)
        const keep = list.find((e) => e._id === selected?._id) || list[0] || null
        setSelected(keep)
        if (keep) loadEmailDetail(keep)
      }
    } catch {
      toast.error('Failed to load emails')
    } finally {
      setLoading(false)
    }
  }, [customerFilter])

  const loadEmailDetail = useCallback(async (item) => {
    if (!item?._id) return
    setLoadingDetail(true)
    try {
      const res = await emailApi.getEmail(item._id)
      if (res.data.success) {
        setSelected(res.data.data)
      }
    } catch {
      setSelected(item)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadMailbox()
  }, [loadMailbox])

  // Poll mailbox + light Gmail sync so new messages appear without manual refresh
  useEffect(() => {
    let syncing = false
    const refresh = async () => {
      if (syncing) return
      syncing = true
      try {
        await emailApi.sync({ limit: 40, sinceDays: 14 })
      } catch {
        // IMAP may be unconfigured — still reload local mailbox
      }
      await loadMailbox()
      syncing = false
    }
    const interval = setInterval(refresh, 90 * 1000)
    return () => clearInterval(interval)
  }, [loadMailbox])

  useEffect(() => {
    if (selected) {
      const sub = getEmailSubject(selected)
      setReplySubject(sub.startsWith('Re:') ? sub : `Re: ${sub}`)
    }
  }, [selected?._id, selected?.emailSubject])

  const handleSelect = (item) => {
    setSelected(item)
    setReplyText('')
    loadEmailDetail(item)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await emailApi.sync({ limit: MAILBOX_LIMIT, sinceDays: 180 })
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
    const cid = selected?.customerId?._id || selected?.customerId || customerFilter
    if (!cid) return
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
    if (!replyText.trim()) return
    const cid = selected?.customerId?._id || selected?.customerId || customerFilter
    if (!selected?._id && !cid) {
      toast.error('Select an email or open inbox from a customer profile to send')
      return
    }
    setSending(true)
    try {
      const res = await emailApi.reply({
        ...(selected?._id ? { interactionId: selected._id } : {}),
        ...(cid ? { customerId: cid } : {}),
        message: replyText.trim(),
        subject: replySubject,
      })
      if (res.data.success) {
        toast.success(res.data.data.message)
        setReplyText('')
        await loadMailbox()
        if (res.data.data.interaction) {
          setSelected(res.data.data.interaction)
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const filtered = emails.filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const body = getEmailBody(item).toLowerCase()
    const sub = getEmailSubject(item).toLowerCase()
    const from = (item.emailFrom || item.customerId?.name || '').toLowerCase()
    return sub.includes(q) || body.includes(q) || from.includes(q)
  })

  const customer = selected?.customerId
  const bodyText = selected ? getEmailBody(selected) : ''

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-[1680px] mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Email inbox' },
        ]}
      />

      {/* Header */}
      <header className="shrink-0 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
              <Inbox className="w-5 h-5" />
            </span>
            Email inbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 ml-12 sm:ml-0">
            Latest <strong>{MAILBOX_LIMIT}</strong> emails · auto-sync ~90s · Send replies via Gmail
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary inline-flex items-center justify-center gap-2 shrink-0"
        >
          {syncing ? <LoadingSpinner size="sm" /> : <RefreshCw className={clsx('w-4 h-4', syncing && 'animate-spin')} />}
          Sync from Gmail
        </button>
      </header>

      {/* Two-panel layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 lg:gap-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
        {/* —— Left: list —— */}
        <aside className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Latest {filtered.length} of {MAILBOX_LIMIT}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject or sender…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Mail className="w-14 h-14 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No emails found</p>
              <p className="text-xs text-slate-400 mt-1">Sync from Gmail to import messages</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto overscroll-contain">
              {filtered.map((item) => {
                const isActive = selected?._id === item._id
                const inbound = item.emailDirection !== 'outbound'
                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={clsx(
                        'w-full text-left px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 transition-all',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800'
                          : 'hover:bg-white dark:hover:bg-slate-800/60'
                      )}
                    >
                      <div className="flex gap-2">
                        <div
                          className={clsx(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            inbound ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40'
                          )}
                        >
                          {inbound ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {getSenderLabel(item)}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(item.date)}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
                            {getEmailSubject(item)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {getPreviewLine(item, 120)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <SentimentBadge label={item.sentimentLabel} size="xs" />
                            <PriorityBadge priority={item.priority} size="xs" />
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        {/* —— Right: reader —— */}
        <main className="flex flex-col min-h-0 bg-white dark:bg-slate-950">
          {!selected ? (
            <>
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
                <Inbox className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-base font-medium text-slate-500">Select an email to read</p>
                <p className="text-sm mt-1">New messages sync automatically every ~90s</p>
              </div>
              {customerFilter && (
                <form
                  onSubmit={handleSendReply}
                  className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    New message via Gmail
                  </p>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="input text-sm bg-slate-50 dark:bg-slate-800"
                    placeholder="Subject"
                  />
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input text-sm min-h-[100px] resize-y bg-slate-50 dark:bg-slate-800 leading-relaxed"
                    placeholder="Write your message…"
                    required
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggestLoading}
                      className="btn-secondary text-sm inline-flex items-center gap-1.5"
                    >
                      {suggestLoading ? <LoadingSpinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                      Suggest reply
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="btn-primary text-sm inline-flex items-center gap-2 ml-auto min-w-[140px] justify-center"
                    >
                      {sending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <>
              {/* Email header */}
              <div className="shrink-0 px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-snug pr-4">
                  {getEmailSubject(selected)}
                </h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    {selected.emailDirection === 'outbound' ? (
                      <>To: <strong className="text-slate-800 dark:text-slate-200">{selected.emailTo}</strong></>
                    ) : (
                      <>From: <strong className="text-slate-800 dark:text-slate-200">{selected.emailFrom}</strong></>
                    )}
                  </span>
                  {customer && (
                    <Link
                      to={`/customers/${customer._id || customer}`}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {customer.name}
                    </Link>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(selected.date)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <SentimentBadge label={selected.sentimentLabel} size="sm" />
                  <PriorityBadge priority={selected.priority} size="sm" />
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    selected.emailDirection === 'outbound'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                  )}>
                    {selected.emailDirection === 'outbound' ? 'Sent by you' : 'Received'}
                  </span>
                </div>
                {selected.emailInsight && (
                  <p className="mt-3 text-sm text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-4 py-2.5 rounded-xl">
                    {selected.emailInsight}
                  </p>
                )}
              </div>

              {/* Email body — real text */}
              <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-20">
                    <LoadingSpinner />
                  </div>
                ) : bodyText ? (
                  <article className="mx-4 my-4 sm:mx-6 sm:my-5 p-6 sm:p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-[15px] leading-7 text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words font-normal">
                      {bodyText}
                    </p>
                  </article>
                ) : (
                  <div className="mx-6 my-8 p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <Mail className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No message body in this email</p>
                    {selected.content && (
                      <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto truncate">
                        Raw: {selected.content.slice(0, 200)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Compose / reply */}
              {(customer || customerFilter) && (
                <form
                  onSubmit={handleSendReply}
                  className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    {selected?.emailDirection === 'outbound' ? 'Send follow-up via Gmail' : 'Reply via Gmail'}
                  </p>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="input text-sm bg-slate-50 dark:bg-slate-800"
                    placeholder="Subject"
                  />
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input text-sm min-h-[100px] resize-y bg-slate-50 dark:bg-slate-800 leading-relaxed"
                    placeholder="Type your reply to the customer…"
                    required
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggestLoading}
                      className="btn-secondary text-sm inline-flex items-center gap-1.5"
                    >
                      {suggestLoading ? <LoadingSpinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                      Suggest reply
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="btn-primary text-sm inline-flex items-center gap-2 ml-auto min-w-[140px] justify-center"
                    >
                      {sending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
