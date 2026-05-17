import { useState, useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'
import LoadingSpinner from '../components/LoadingSpinner'
import SentimentBadge from '../components/SentimentBadge'
import { getSentimentClasses, getChurnRiskClasses } from '../utils/sentimentUtils'
import { capitalize } from '../utils/formatters'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Trophy,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Sparkles,
  DollarSign,
  Briefcase,
  TrendingDown,
  Users,
  ChevronRight
} from 'lucide-react'

export default function PerformancePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axiosInstance.get('/dashboard/performance')
      if (response.data.success) {
        setData(response.data.data)
      } else {
        throw new Error(response.data.error || 'Failed to fetch performance statistics')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch performance statistics')
      toast.error('Failed to load performance metrics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          Compiling Quota & Portfolio Revenue metrics...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto card text-center py-16 px-6 border-red-150/40 dark:border-red-950/20 bg-red-50/10">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/30 text-red-650 flex items-center justify-center mx-auto mb-4 text-xl">
          ⚠️
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Failed to load Performance Dashboard</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchPerformanceData}
          className="mt-6 btn-primary px-5 py-2 inline-flex items-center gap-2 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    )
  }

  const { summary, riskMetrics, activityQuota, watchlist, achievements, isGlobal } = data
  const quotaPercentage = Math.min(summary.quotaPercentage, 200) // cap SVG draw at 200%

  // SVG parameters for circular progress ring
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(quotaPercentage, 100) / 100) * circumference

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-linear-to-r from-blue-50/50 via-indigo-50/20 to-purple-50/40 dark:from-slate-900/40 dark:via-slate-950/10 dark:to-purple-950/20 p-6 border border-slate-100 dark:border-slate-800/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400">
              <Trophy size={20} />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isGlobal ? 'Global Sales Oversight Cockpit' : 'My Quota & Performance Tracker'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isGlobal 
              ? 'Aggregated portfolio analysis and operational quotas across all platform managers.'
              : 'Monitor quarterly revenue targets, track weekly logged touchpoints, and manage high-value watchlists.'
            }
          </p>
        </div>
        <button
          onClick={fetchPerformanceData}
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          🔄 Refresh Metrics
        </button>
      </header>

      {/* Main Revenue quota & Activity grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Circular Quota Progress ring */}
        <section className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 flex flex-col items-center text-center justify-between shadow-xs min-h-[360px]">
          <div className="w-full text-left">
            <h3 className="flex items-center gap-2 text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <Target size={14} className="text-brand-500" />
              Quarterly Quota Target
            </h3>
          </div>

          <div className="relative flex items-center justify-center my-6">
            {/* SVG circle container */}
            <svg className="w-40 h-40 transform -rotate-90">
              {/* Background circle track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Colored progress circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-brand-600 dark:stroke-indigo-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {summary.quotaPercentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                Completed
              </span>
            </div>
          </div>

          <div className="w-full space-y-1">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ${summary.closedRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              of ${summary.targetQuota.toLocaleString()} target closed won
            </p>
          </div>
        </section>

        {/* Financial Cards Grid */}
        <section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portfolio closed won card */}
          <div className="card p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between min-h-[170px] group hover:border-emerald-250 dark:hover:border-emerald-900/30 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                  <DollarSign size={13} className="text-emerald-500" />
                  Closed Revenue Won
                </span>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mt-3">
                  ${summary.closedRevenue.toLocaleString()}
                </h4>
              </div>
              <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
              </span>
            </div>
            <div className="text-xs text-slate-450 dark:text-slate-500 font-semibold border-t border-slate-50 dark:border-slate-800/60 pt-3">
              Represented by <strong className="text-emerald-600 dark:text-emerald-450 font-bold">{summary.activeCount - summary.atRiskCount} active</strong> healthy customer portfolios.
            </div>
          </div>

          {/* Pipeline estimated card */}
          <div className="card p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between min-h-[170px] group hover:border-brand-250 dark:hover:border-brand-900/30 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                  <Briefcase size={13} className="text-brand-500" />
                  Pipeline Value Estimated
                </span>
                <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mt-3">
                  ${summary.pipelineRevenue.toLocaleString()}
                </h4>
              </div>
              <span className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/20 text-brand-650 dark:text-brand-400 group-hover:scale-110 transition-transform">
                <Sparkles size={20} />
              </span>
            </div>
            <div className="text-xs text-slate-450 dark:text-slate-500 font-semibold border-t border-slate-50 dark:border-slate-800/60 pt-3">
              Aggregate valuation of <strong className="text-brand-600 dark:text-brand-400 font-bold">{summary.totalCustomers} total</strong> platform assigned accounts.
            </div>
          </div>

          {/* Weekly quota activities card */}
          <div className="card p-6 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm md:col-span-2 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                <Award size={14} className="text-indigo-500" />
                Touchpoint Activity Quotas (Last 30 Days)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Emails progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                  <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> Emails logged</span>
                  <span>{activityQuota.emails.current} / {activityQuota.emails.target}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((activityQuota.emails.current / activityQuota.emails.target) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Calls progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                  <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> Phone Calls</span>
                  <span>{activityQuota.calls.current} / {activityQuota.calls.target}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((activityQuota.calls.current / activityQuota.calls.target) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Meetings progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                  <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> Meetings held</span>
                  <span>{activityQuota.meetings.current} / {activityQuota.meetings.target}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand-600 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((activityQuota.meetings.current / activityQuota.meetings.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Portfolio watchlists & Quota achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Watchlist card table */}
        <section className="lg:col-span-2 card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50 dark:border-slate-800/60">
            <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
              <Users size={14} className="text-brand-500" />
              High-Value Watchlist
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              Top 5 Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead>
                <tr className="text-left text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                  <th className="pb-3">Client / Company</th>
                  <th className="pb-3">Account Value</th>
                  <th className="pb-3">Sentiment</th>
                  <th className="pb-3">Churn Risk</th>
                  <th className="pb-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-350">
                {watchlist.map(c => {
                  const churn = getChurnRiskClasses(c.churnScore)
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/20 dark:hover:bg-slate-850/10">
                      <td className="py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{c.company || 'No Company'}</p>
                      </td>
                      <td className="py-3.5 font-extrabold text-slate-800 dark:text-white">
                        ${c.value.toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <SentimentBadge label={c.overallSentiment} size="xs" />
                      </td>
                      <td className="py-3.5">
                        <span className={clsx("font-bold text-[10px] uppercase tracking-wider", churn.text)}>
                          {churn.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <a
                          href={`/customers/${c._id}`}
                          className="inline-flex items-center gap-0.5 p-1 rounded-lg border border-slate-200 hover:border-brand-200 text-slate-500 hover:text-brand-600 dark:border-slate-850 dark:hover:text-brand-400 bg-white dark:bg-slate-800 transition"
                        >
                          <ChevronRight size={14} />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quota Achievements desk */}
        <section className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-widest flex items-center gap-1.5 pb-3 border-b border-slate-50 dark:border-slate-800/60 mb-4">
              <Award size={14} className="text-amber-500 animate-bounce" />
              Milestones & Achievements
            </h3>
            
            <div className="space-y-4">
              {achievements.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <span className="text-2xl">🌱</span>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-2">Log Touchpoints to Unlock</h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
                    Achievements and portfolio milestone medals will automatically generate based on quota metrics.
                  </p>
                </div>
              ) : (
                achievements.map((ach, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-brand-100/50 dark:border-brand-950/20 bg-linear-to-r from-brand-50/20 to-indigo-50/10 dark:from-slate-850/40 dark:to-slate-900/30 shadow-xs flex gap-3 items-start hover:shadow-xs transition"
                  >
                    <span className="text-lg shrink-0 mt-0.5">🏆</span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                        {ach.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-semibold">
                        {ach.desc}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
            <span>Quota Cycle</span>
            <span>Q2 — Active</span>
          </div>
        </section>

      </div>

    </div>
  )
}
