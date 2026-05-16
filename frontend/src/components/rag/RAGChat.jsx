import { useState } from 'react'
import axiosInstance from '../../api/axiosInstance'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, X, Bot, ChevronDown, ChevronUp } from 'lucide-react'

export default function RAGChat({ customerId, customerName, onClose }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const sendQuestion = async () => {
    if (!question.trim() || isLoading) return

    const userQuestion = question.trim()
    setMessages((previousMessages) => [...previousMessages, {
      role: 'user',
      content: userQuestion,
      timestamp: new Date(),
    }])
    setQuestion('')
    setIsLoading(true)

    try {
      const response = await axiosInstance.post('/rag/query', {
        question: userQuestion,
        customerId,
      })

      setMessages((previousMessages) => [...previousMessages, {
        role: 'assistant',
        content: response.data.data.answer,
        metrics: response.data.data.metrics,
        timestamp: new Date(),
      }])
    } catch {
      setMessages((previousMessages) => [...previousMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true,
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 w-[min(24rem,calc(100vw-1.5rem))] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
    >
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="w-5 h-5 text-white shrink-0" />
          <span className="font-semibold text-white truncate">SynapseAI Assistant</span>
          {customerName && (
            <span className="text-xs text-indigo-200 truncate">- {customerName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-indigo-200 transition"
            aria-label={isExpanded ? 'Collapse assistant' : 'Expand assistant'}
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <button onClick={onClose} className="text-white hover:text-indigo-200 transition" aria-label="Close assistant">
            <X size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <Bot className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Ask me about this customer:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• "What is the customer's overall sentiment?"</li>
                  <li>• "Why are they at risk of churning?"</li>
                  <li>• "What should I do to retain them?"</li>
                </ul>
              </div>
            )}

            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}`}
                  initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : message.isError
                        ? 'bg-red-100 text-red-700'
                        : 'bg-white border border-gray-200 text-gray-700'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.metrics && (
                      <div className="mt-2 text-xs opacity-75 border-t pt-1 flex flex-wrap gap-2">
                        <span>📊 {message.metrics.totalInteractions} interactions</span>
                        <span>😊 {message.metrics.sentimentCounts?.positive || 0}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && sendQuestion()}
                placeholder="Ask about this customer..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                onClick={sendQuestion}
                disabled={isLoading || !question.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send question"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}