import { useState } from 'react'
import { Mail, Sparkles, RefreshCw, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'
import SentimentBadge from './SentimentBadge'
import PriorityBadge from './PriorityBadge'
import { customersApi } from '../api/customersApi'

import CustomerSentimentChart from './CustomerSentimentChart'

export default function EmailInsightPanel({ customer, interactions = [], onAnalyzed }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [loadingReply, setLoadingReply] = useState(false)
  const [suggestedReply, setSuggestedReply] = useState('')
  const [copied, setCopied] = useState(false)

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await customersApi.analyzeEmails(customer._id)
      if (res.data.success) {
        toast.success(res.data.data?.message || 'Email analysis complete')
        onAnalyzed?.(res.data.data?.customer)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Is the AI service running?')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSuggestReply = async () => {
    setLoadingReply(true)
    setSuggestedReply('')
    try {
      const res = await customersApi.getSuggestedResponse(customer._id)
      if (res.data.success) {
        setSuggestedReply(res.data.data.suggestedReply)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not generate reply')
    } finally {
      setLoadingReply(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(suggestedReply)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card border border-indigo-100 dark:border-indigo-900/40 bg-linear-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-gray-900">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email intelligence</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sentiment & priority from imported emails
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="btn-secondary text-sm inline-flex items-center gap-1.5 shrink-0"
        >
          {analyzing ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
          {analyzing ? 'Analyzing…' : 'Analyze emails'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SentimentBadge label={customer.overallSentiment} size="sm" />
        <PriorityBadge priority={customer.priority} score={customer.priorityScore} />
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Last 3 days</p>
        <CustomerSentimentChart interactions={interactions} />
      </div>

      {customer.emailInsight && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 p-3 rounded-lg bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
          {customer.emailInsight}
        </p>
      )}

      {customer.lastEmailSubject && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Latest email: <span className="font-medium text-gray-700 dark:text-gray-300">{customer.lastEmailSubject}</span>
        </p>
      )}

      <button
        type="button"
        onClick={handleSuggestReply}
        disabled={loadingReply}
        className="btn-primary text-sm w-full sm:w-auto inline-flex items-center justify-center gap-2"
      >
        {loadingReply ? <LoadingSpinner size="sm" /> : <Sparkles className="w-4 h-4" />}
        {loadingReply ? 'Generating…' : 'Suggest reply'}
      </button>

      {suggestedReply && (
        <div className="mt-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Suggested response</p>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
            {suggestedReply}
          </pre>
        </div>
      )}
    </div>
  )
}
