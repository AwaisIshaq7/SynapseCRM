import { useState } from 'react'
import axiosInstance from '../../api/axiosInstance'
import LoadingSpinner from '../LoadingSpinner'
import { Bot, FileText, Send, Sparkles, X } from 'lucide-react'

const PROMPTS = [
  'What is the biggest churn risk for this customer?',
  'Summarize the latest sentiment trend.',
  'What should the sales manager do next?',
]

export default function RAGChat({ customerId, customerName, onClose }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState('')

  const pushAssistantMessage = (content) => {
    setMessages((prev) => [...prev, { role: 'assistant', content }])
  }

  const askQuestion = async (e, presetQuestion) => {
    e?.preventDefault()
    const trimmed = (presetQuestion || question).trim()
    if (!trimmed || loading) return

    setQuestion('')
    setError('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])

    try {
      const response = await axiosInstance.post('/rag/query', {
        question: trimmed,
        customerId,
      })

      if (response.data.success) {
        pushAssistantMessage(response.data.data.answer)
      } else {
        throw new Error(response.data.error || 'AI assistant failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'AI assistant failed')
    } finally {
      setLoading(false)
    }
  }

  const summarizeCustomer = async () => {
    if (summaryLoading) return
    setError('')
    setSummaryLoading(true)

    try {
      const response = await axiosInstance.post(`/rag/summarize/${customerId}`)
      if (response.data.success) {
        pushAssistantMessage(response.data.data.summary)
      } else {
        throw new Error(response.data.error || 'Summary failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Summary failed')
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Synapse AI</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{customerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close AI assistant"
          >
            <X size={18} />
          </button>
        </header>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-950/40">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={summarizeCustomer}
              disabled={summaryLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {summaryLoading ? <LoadingSpinner size="sm" /> : <FileText size={14} />}
              Customer summary
            </button>
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={(e) => askQuestion(e, prompt)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Sparkles size={13} />
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Ask Synapse AI about churn risk, sentiment history, next actions, or recent customer context.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div className={`max-w-[86%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <LoadingSpinner size="sm" />
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <form onSubmit={askQuestion} className="flex gap-3 border-t border-slate-200 p-4 dark:border-slate-700">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="input flex-1"
            placeholder="Ask about this customer..."
            disabled={loading}
          />
          <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading || !question.trim()}>
            <Send size={16} />
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
