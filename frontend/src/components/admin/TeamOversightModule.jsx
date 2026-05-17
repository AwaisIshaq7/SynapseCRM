import { useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../LoadingSpinner'
import SentimentBadge from '../SentimentBadge'
import { getChurnRiskClasses } from '../../utils/sentimentUtils'
import { capitalize, formatDate, timeAgo, getInteractionIcon } from '../../utils/formatters'
import { Users, AlertTriangle, FileText, ChevronRight, Calendar, UserCheck, BarChart3 } from 'lucide-react'
import clsx from 'clsx'

export default function TeamOversightModule({ data, loading }) {
  const managers = data?.managerDetails || []
  const [selectedManagerId, setSelectedManagerId] = useState(null)
  const [activeTab, setActiveTab] = useState('customers') // 'customers' or 'interactions'

  if (loading) {
    return (
      <div className="card h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const selectedManager = managers.find(m => m._id === selectedManagerId)

  return (
    <div className="card overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl rounded-3xl">
      {/* Module Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
            <Users size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sales Team Oversight</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inspect portfolio accounts and live interaction note feeds per sales manager.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 h-[580px]">
        {/* Left Column: Manager Selector Sidebar */}
        <div className="overflow-y-auto p-4 space-y-2 bg-slate-50/30 dark:bg-slate-900/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2">Sales Managers</p>
          {managers.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No sales managers found.</p>
          ) : (
            managers.map(manager => {
              const isSelected = manager._id === selectedManagerId
              const churnStyles = getChurnRiskClasses(manager.avgChurnScore)
              
              return (
                <button
                  key={manager._id}
                  onClick={() => setSelectedManagerId(manager._id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3 group',
                    isSelected 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/10' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                      isSelected ? 'bg-white/20 text-white' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    )}>
                      {manager.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate">{manager.name}</p>
                      <p className={clsx(
                        'text-[10px] truncate',
                        isSelected ? 'text-brand-200' : 'text-slate-400 dark:text-slate-500'
                      )}>{manager.customerCount} customers</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <span className={clsx(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                      isSelected ? 'bg-white/20 text-white' : churnStyles.bg
                    )}>
                      {manager.avgChurnScore.toFixed(2)}
                    </span>
                    <ChevronRight size={14} className={clsx(
                      'transition-transform duration-200',
                      isSelected ? 'text-white' : 'text-slate-400 group-hover:translate-x-0.5'
                    )} />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Right Column: Workspace Details */}
        <div className="overflow-y-auto p-6 flex flex-col">
          {!selectedManager ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 border border-slate-100 dark:border-slate-800/40">
                <UserCheck size={28} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Manager Selected</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">Select a sales manager from the sidebar to inspect their clients list, recent logs, and portfolio sentiment health.</p>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Selected Manager Info Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                    <span className="text-brand-700 dark:text-brand-300 font-bold text-lg">
                      {selectedManager.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{selectedManager.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedManager.email}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <Calendar size={10} />
                      <span>Joined {formatDate(selectedManager.joinedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Micro Stats Cards */}
                <div className="flex gap-2">
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-2 text-center min-w-[70px] bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-[10px] text-slate-400">Active</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedManager.activeCount}</p>
                  </div>
                  <div className="rounded-xl border border-red-100 dark:border-red-950/20 p-2 text-center min-w-[70px] bg-red-50/30 dark:bg-red-950/10">
                    <p className="text-[10px] text-red-500">At Risk</p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-300">{selectedManager.atRiskCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-2 text-center min-w-[70px] bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-[10px] text-slate-400">Avg Churn</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedManager.avgChurnScore.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="flex border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('customers')}
                  className={clsx(
                    'py-2 px-4 text-xs font-bold border-b-2 transition-all duration-200',
                    activeTab === 'customers'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  )}
                >
                  Client Portfolio ({selectedManager.customers?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('interactions')}
                  className={clsx(
                    'py-2 px-4 text-xs font-bold border-b-2 transition-all duration-200',
                    activeTab === 'interactions'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  )}
                >
                  Recent Activities ({selectedManager.recentInteractions?.length || 0})
                </button>
              </div>

              {/* Tab Workspace Panel */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'customers' ? (
                  <div className="space-y-2">
                    {(!selectedManager.customers || selectedManager.customers.length === 0) ? (
                      <p className="text-xs text-slate-400 py-8 text-center">No assigned customers.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                              <th className="py-2 font-semibold">Name</th>
                              <th className="py-2 font-semibold">Company</th>
                              <th className="py-2 font-semibold">Sentiment</th>
                              <th className="py-2 font-semibold">Risk Rating</th>
                              <th className="py-2 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {selectedManager.customers.map(customer => {
                              const riskStyles = getChurnRiskClasses(customer.churnScore)
                              
                              return (
                                <tr key={customer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                  <td className="py-3 font-semibold text-slate-900 dark:text-white">
                                    <Link to={`/customers/${customer._id}`} className="hover:underline hover:text-brand-600">
                                      {customer.name}
                                    </Link>
                                  </td>
                                  <td className="py-3 text-slate-500 dark:text-slate-400">{customer.company || '—'}</td>
                                  <td className="py-3">
                                    <SentimentBadge label={customer.overallSentiment} size="xs" />
                                  </td>
                                  <td className="py-3">
                                    <div className="flex items-center gap-2">
                                      <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', riskStyles.bg, riskStyles.text)}>
                                        {customer.churnScore.toFixed(2)}
                                      </span>
                                      <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                        <div 
                                          className={clsx('h-full rounded-full', 
                                            customer.churnScore >= 0.7 ? 'bg-red-500' : customer.churnScore >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                                          )} 
                                          style={{ width: `${customer.churnScore * 100}%` }} 
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 text-right">
                                    <Link to={`/customers/${customer._id}`} className="text-[10px] font-bold text-brand-600 hover:text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1 rounded-lg">
                                      Inspect
                                    </Link>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(!selectedManager.recentInteractions || selectedManager.recentInteractions.length === 0) ? (
                      <p className="text-xs text-slate-400 py-8 text-center">No recent interactions logged.</p>
                    ) : (
                      selectedManager.recentInteractions.map(interaction => {
                        const iconData = getInteractionIcon(interaction.type)
                        const cName = interaction.customerId?.name || 'Unknown'
                        const isNegative = interaction.sentimentLabel === 'negative'
                        
                        return (
                          <div 
                            key={interaction._id} 
                            className={clsx(
                              'p-3.5 rounded-2xl border text-xs transition duration-200',
                              isNegative 
                                ? 'bg-red-50/20 border-red-100 dark:bg-red-950/5 dark:border-red-950/20' 
                                : 'bg-slate-50/30 border-slate-100 dark:bg-slate-900/10 dark:border-slate-800/50'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{iconData.icon}</span>
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{interaction.type}</span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mx-2">•</span>
                                  <Link to={`/customers/${interaction.customerId?._id}`} className="font-semibold text-brand-600 hover:underline">
                                    {cName}
                                  </Link>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                                {timeAgo(interaction.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-6">{interaction.content}</p>
                            <div className="mt-2.5 flex items-center justify-between pl-6 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">Logged by {selectedManager.name}</span>
                              <SentimentBadge label={interaction.sentimentLabel} size="xs" />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
