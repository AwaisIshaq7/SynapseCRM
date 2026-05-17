import { useState, useEffect, useRef } from 'react'
import axiosInstance from '../../api/axiosInstance'
import LoadingSpinner from '../LoadingSpinner'
import { Bot, FileText, Send, Sparkles, X, Clipboard, Trash2, User, RefreshCw, HelpCircle, Check, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESETS = [
  {
    label: 'Generate PDF Executive Report',
    text: "Generate a PDF report summarizing sales manager Sarah's portfolio performance over the last 30 days and list key accounts at risk.",
    icon: '📄'
  },
  {
    label: 'Churn Risk Analysis',
    text: 'What is the biggest churn risk for this customer?',
    icon: '📊'
  },
  {
    label: 'Sentiment Trends',
    text: 'Summarize the latest sentiment trend.',
    icon: '📈'
  },
  {
    label: 'Email Reply & Approach',
    text: 'How should I reply to this customer & what approach should I take?',
    icon: '📧'
  },
  {
    label: 'Key Complaints/Demands',
    text: 'Analyze customer interactions and identify their main complaints or demands.',
    icon: '🔍'
  },
  {
    label: 'Loyalty Offer Draft',
    text: 'Draft a custom loyalty or discount discount offer template for this customer based on their status.',
    icon: '🎁'
  }
]

// Dynamic follow-up recommendations based on the conversation state
const SUGGESTED_FOLLOW_UPS = [
  'What should my concrete next steps be?',
  'Draft an apology email template.',
  'Analyze their sentiment over the last month.',
  'Propose a loyalty retention strategy.'
]

/**
 * Custom formatter component for structured AI responses
 */
function FormattedMessage({ content }) {
  const hasAnalysis = content.toUpperCase().includes("ANALYSIS & INSIGHTS") || content.toUpperCase().includes("ANALYSIS");
  const hasApproach = content.toUpperCase().includes("STRATEGIC APPROACH") || content.toUpperCase().includes("STRATEGIC");
  const hasReply = content.toUpperCase().includes("RECOMMENDED REPLY DRAFT") || content.toUpperCase().includes("RECOMMENDED");

  if (!hasAnalysis && !hasApproach && !hasReply) {
    return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
  }

  let analysisText = "";
  let approachText = "";
  let replyText = "";
  let generalText = "";

  const lines = content.split("\n");
  let currentSection = "general";

  lines.forEach(line => {
    const upper = line.toUpperCase();
    if (upper.includes("ANALYSIS & INSIGHTS") || upper.includes("ANALYSIS")) {
      currentSection = "analysis";
    } else if (upper.includes("STRATEGIC APPROACH") || upper.includes("STRATEGIC")) {
      currentSection = "approach";
    } else if (upper.includes("RECOMMENDED REPLY DRAFT") || upper.includes("RECOMMENDED")) {
      currentSection = "reply";
    } else {
      if (currentSection === "analysis") analysisText += line + "\n";
      else if (currentSection === "approach") approachText += line + "\n";
      else if (currentSection === "reply") replyText += line + "\n";
      else generalText += line + "\n";
    }
  });

  const handleCopy = (text) => {
    const cleanText = text.trim();
    navigator.clipboard.writeText(cleanText);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-4 w-full text-slate-700 dark:text-slate-300">
      {generalText.trim() && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed mb-2 font-medium">
          {generalText.trim()}
        </div>
      )}

      {analysisText.trim() && (
        <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 transition-all duration-300 hover:shadow-xs">
          <h4 className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">
            <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/30">📊</span> Analysis & Insights
          </h4>
          <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {analysisText.trim()}
          </div>
        </div>
      )}

      {approachText.trim() && (
        <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 transition-all duration-300 hover:shadow-xs">
          <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
            <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">🚀</span> Strategic Approach
          </h4>
          <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {approachText.trim()}
          </div>
        </div>
      )}

      {replyText.trim() && (
        <div className="relative p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-inner group/reply">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800">📧</span> Recommended Reply Draft
            </h4>
            <button
              onClick={() => handleCopy(replyText)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300 transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Clipboard size={13} />
              Copy Draft
            </button>
          </div>
          <div className="whitespace-pre-wrap text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-900">
            {replyText.trim()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RAGChat({ customerId, customerName, onClose }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef(null)

  // Smooth scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const pushAssistantMessage = (content) => {
    setMessages((prev) => [...prev, { role: 'assistant', content, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
  }

  const askQuestion = async (e, presetQuestion) => {
    e?.preventDefault()
    const trimmed = (presetQuestion || question).trim()
    if (!trimmed || loading) return

    setQuestion('')
    setError('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: trimmed, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])

    try {
      const response = await axiosInstance.post('/rag/query', {
        question: trimmed,
        customerId,
      })

      if (response.data.success) {
        const { answer, contextUsed } = response.data.data;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: answer,
            pdfReport: contextUsed?.pdfReport,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
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

  const clearChat = () => {
    setMessages([])
    setError('')
    toast.success('Chat history cleared')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md animate-fade-in">
      <section className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/50 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200/60 px-6 py-4 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="relative rounded-2xl bg-linear-to-tr from-brand-600 to-indigo-600 p-2.5 text-white shadow-md shadow-brand-500/20">
              <Bot size={22} />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Synapse AI</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Retrieved context: {customerName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="rounded-xl p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Clear Chat History"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
              aria-label="Close AI assistant"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Quick Insights Action Bar */}
        <div className="border-b border-slate-200/60 bg-slate-50/50 px-6 py-4 dark:border-slate-800/60 dark:bg-slate-950/20">
          <div className="flex items-center gap-2 mb-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <Lightbulb size={13} />
            AI Analytical Actions
          </div>
          <div className="flex flex-wrap gap-2.5 max-h-32 overflow-y-auto pr-2">
            <button
              type="button"
              onClick={summarizeCustomer}
              disabled={summaryLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:border-slate-350 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer shadow-xs active:scale-98"
            >
              {summaryLoading ? <LoadingSpinner size="sm" /> : <FileText size={14} className="text-brand-600 dark:text-brand-400" />}
              3-Sentence Summary
            </button>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={(e) => askQuestion(e, preset.text)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 dark:hover:border-brand-900 cursor-pointer shadow-xs active:scale-98"
              >
                <span>{preset.icon}</span>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Flow */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6 scroll-smooth bg-slate-50/30 dark:bg-slate-900/10">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 animate-bounce">
                <Sparkles size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Consult SynapseAI Conversational Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed">
                Analyze churn probability, query complaints, draft customized loyalty offers, or receive complete talking points and email drafts.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex gap-3 items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Bot Avatar */}
                  {message.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <Bot size={18} />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-5 py-4 text-sm leading-6 shadow-xs border transition-all duration-300 w-full ${
                      message.role === 'user'
                        ? 'bg-linear-to-r from-brand-600 to-indigo-600 text-white border-brand-500 rounded-tr-none'
                        : 'bg-white text-slate-800 dark:bg-slate-850 dark:text-slate-200 border-slate-100 dark:border-slate-800/40 rounded-tl-none'
                    }`}
                    >
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                      ) : (
                        <FormattedMessage content={message.content} />
                      )}
                    </div>
                    
                    {/* Render Executive PDF Download Card if present! */}
                    {message.role === 'assistant' && message.pdfReport && message.pdfReport.created && (
                      <div className="mt-3 w-full rounded-2xl border border-brand-200/60 dark:border-brand-900/30 bg-linear-to-r from-brand-50 to-indigo-50/50 dark:from-brand-950/20 dark:to-indigo-950/20 p-4 shadow-md animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 text-xl">
                            📄
                          </span>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight uppercase tracking-wider">
                              Executive AI PDF Report
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {message.pdfReport.title}
                            </p>
                          </div>
                        </div>
                        <a
                          href={message.pdfReport.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-center shadow-md shadow-brand-500/10 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Download PDF Report 📥
                        </a>
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-400 mt-1 px-1 font-semibold">
                      {message.time || 'Just now'}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {message.role === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-inner shrink-0 border border-slate-300/40 dark:border-slate-700/40">
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex gap-3 items-start justify-start">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Bot size={18} />
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-850 p-4 border border-slate-100 dark:border-slate-800/40 flex items-center gap-3 shadow-xs">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Synthesizing CRM context...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-150 dark:border-red-900/20 p-4 text-sm text-red-700 dark:text-red-300 flex items-center gap-2.5">
              <span>⚠️</span>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Dummy element for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Follow-up Suggestions Panel */}
        {messages.length > 0 && !loading && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <HelpCircle size={12} />
              Follow up:
            </span>
            <div className="flex gap-2">
              {SUGGESTED_FOLLOW_UPS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={(e) => askQuestion(e, suggestion)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 hover:border-brand-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 transition-all text-xs font-semibold cursor-pointer active:scale-95 shadow-xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={askQuestion} className="flex gap-3 border-t border-slate-200/60 p-5 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="input flex-1 rounded-2xl border-slate-200 focus:border-brand-500 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30 text-sm focus:ring-1 focus:ring-brand-500/20"
            placeholder="Type a custom query or ask follow-ups..."
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn-primary inline-flex items-center gap-2 rounded-2xl shadow-md shadow-brand-500/10 px-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading || !question.trim()}
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </section>
    </div>
  )
}
