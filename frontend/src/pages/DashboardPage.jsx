import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { usersApi } from '../api/usersApi'
import StatCard from '../components/StatCard'
import SentimentBadge from '../components/SentimentBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { timeAgo } from '../utils/formatters'
import { getChurnRiskClasses } from '../utils/sentimentUtils'
import clsx from 'clsx'

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
)

// ─────────────────────────────────────────────────────────────
// Adaptive widget order — reads from user.preferences.widgetOrder
// Default order depends on role
// ─────────────────────────────────────────────────────────────
const ADMIN_DEFAULT_ORDER   = ['summary', 'churn', 'sentiment', 'recent', 'alerts']
const MANAGER_DEFAULT_ORDER = ['alerts', 'sentiment', 'summary', 'recent', 'churn']

export default function DashboardPage() {
  const { user, isAdmin, updateUserPreferences } = useAuth()
  const { summary, sentimentTrend, churnDist, loading } = useDashboard()
  const navigate = useNavigate()

  // Determine widget order — from user preferences or role default
  const defaultOrder = isAdmin ? ADMIN_DEFAULT_ORDER : MANAGER_DEFAULT_ORDER
  const widgetOrder  = user?.preferences?.widgetOrder || defaultOrder

  // Usage tracking — count widget clicks
  const usageCountRef = useRef(user?.usageLog || {})
  const sessionCount  = useRef(0)

  // Track widget click — logs to backend + adapts order after 5 sessions
  const trackWidget = async (widgetName) => {
    usageCountRef.current[widgetName] = (usageCountRef.current[widgetName] || 0) + 1
    sessionCount.current += 1

    try {
      await usersApi.logUsage(widgetName)

      // Auto-reorder after 5 interactions
      if (sessionCount.current >= 5) {
        const sorted = Object.entries(usageCountRef.current)
          .sort(([, a], [, b]) => b - a)
          .map(([name]) => name)

        // Merge sorted with any widgets not yet in usage log
        const missing = defaultOrder.filter(w => !sorted.includes(w))
        const newOrder = [...sorted, ...missing]

        await usersApi.updatePreferences({ widgetOrder: newOrder })
        updateUserPreferences({ widgetOrder: newOrder })
        sessionCount.current = 0
        toast.success('Dashboard reordered based on your usage 🎯', { duration: 3000 })
      }
    } catch {
      // Silent fail — usage tracking is non-critical
    }
  }

  // ─── CHART DATA ───────────────────────────────────────────
  const isDark = user?.preferences?.theme === 'dark'

  const getAreaGradient = (context, startColor, endColor) => {
    const { chart } = context
    const { ctx, chartArea } = chart
    if (!chartArea) return endColor

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    gradient.addColorStop(0, startColor)
    gradient.addColorStop(1, endColor)
    return gradient
  }

  const sentimentChartData = sentimentTrend ? {
    labels: sentimentTrend.labels,
    datasets: [
      {
        label: 'Positive',
        data: sentimentTrend.positive,
        borderColor: '#16a34a',
        backgroundColor: (context) => getAreaGradient(context, 'rgba(22,163,74,0.28)', 'rgba(22,163,74,0.02)'),
        fill: true,
        tension: 0.4,
        borderWidth: 2.2,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      {
        label: 'Neutral',
        data: sentimentTrend.neutral,
        borderColor: '#d97706',
        backgroundColor: (context) => getAreaGradient(context, 'rgba(217,119,6,0.26)', 'rgba(217,119,6,0.02)'),
        fill: true,
        tension: 0.4,
        borderWidth: 2.2,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
      {
        label: 'Negative',
        data: sentimentTrend.negative,
        borderColor: '#dc2626',
        backgroundColor: (context) => getAreaGradient(context, 'rgba(220,38,38,0.26)', 'rgba(220,38,38,0.02)'),
        fill: true,
        tension: 0.4,
        borderWidth: 2.2,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  } : null

  const churnChartData = churnDist ? {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [churnDist.high || 0, churnDist.medium || 0, churnDist.low || 0],
      backgroundColor: ['#dc2626', '#d97706', '#16a34a'],
      borderColor: isDark ? '#1f2937' : '#fff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 12, family: 'Manrope, sans-serif' } }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.96)',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.22)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
        grid:  { color: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.2)' },
      },
      y: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
        grid:  { color: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.2)' },
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    radius: '94%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.96)',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.22)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
      },
    },
  }

  const recentCount = summary?.recentInteractions?.length || 0
  const alertCount = summary?.churnAlerts?.length || 0
  const currentHour = new Date().getHours()
  const todayGreeting = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening'

  // ─── WIDGET RENDERERS ─────────────────────────────────────
  const widgets = {
    summary: (
      <section key="summary" aria-label="Key metrics" onClick={() => trackWidget('summary')}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Customers"
            value={summary?.totalCustomers}
            loading={loading}
              colorClass="text-brand-600 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            onClick={() => navigate('/customers')}
          />
          <StatCard
            label="At Risk"
            value={summary?.atRiskCount}
            loading={loading}
              colorClass="text-red-600 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            onClick={() => navigate('/customers?status=at_risk')}
          />
          <StatCard
            label="Positive Sentiment"
            value={summary?.positiveCount}
            loading={loading}
              colorClass="text-green-600 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Negative Sentiment"
            value={summary?.negativeCount}
            loading={loading}
              colorClass="text-amber-600 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>
      </section>
    ),

    sentiment: (
      <section key="sentiment" className="card" onClick={() => trackWidget('sentiment')} aria-label="Sentiment trend chart">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sentiment Trend — Last 7 Days
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
        ) : sentimentChartData ? (
          <div className="h-56" role="img" aria-label="Line chart showing positive, neutral, and negative sentiment trends">
            <Line data={sentimentChartData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            No sentiment data yet — add interactions to see trends
          </div>
        )}
      </section>
    ),

    churn: (
      <section key="churn" className="card" onClick={() => trackWidget('churn')} aria-label="Churn risk distribution">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Churn Risk Distribution
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
        ) : churnChartData ? (
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 shrink-0" role="img" aria-label="Doughnut chart showing churn risk levels">
              <Doughnut
                data={churnChartData}
                options={doughnutOptions}
              />
            </div>
            <div className="space-y-3">
              {[
                { label: 'High Risk',   value: churnDist?.high   || 0, color: 'bg-red-500' },
                { label: 'Medium Risk', value: churnDist?.medium || 0, color: 'bg-amber-500' },
                { label: 'Low Risk',    value: churnDist?.low    || 0, color: 'bg-green-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={clsx('w-3 h-3 rounded-full shrink-0', item.color)} aria-hidden="true" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data available</div>
        )}
      </section>
    ),

    alerts: (
      <section key="alerts" className="card border-l-4 border-l-red-500" onClick={() => trackWidget('alerts')} aria-label="Churn alerts">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            ⚠️ Churn Alerts
          </h2>
          {summary?.churnAlerts?.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold dark:bg-red-900/30 dark:text-red-400">
              {summary.churnAlerts.length}
            </span>
          )}
        </div>
        {loading ? <LoadingSpinner /> : (
          summary?.churnAlerts?.length > 0 ? (
            <ul className="space-y-2" aria-label="Customers at churn risk">
              {summary.churnAlerts.map(alert => {
                const churnStyles = getChurnRiskClasses(alert.churnScore)
                return (
                  <li key={alert._id}>
                    <Link
                      to={`/customers/${alert._id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50
                                 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      aria-label={`${alert.name} — churn risk: ${churnStyles.label}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{alert.company}</p>
                      </div>
                      <span className={clsx('text-xs font-bold', churnStyles.text)}>
                        {churnStyles.label} {alert.churnScore != null ? `(${(alert.churnScore * 100).toFixed(0)}%)` : ''}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              🎉 No high-risk churn alerts
            </p>
          )
        )}
      </section>
    ),

    recent: (
      <section key="recent" className="card" onClick={() => trackWidget('recent')} aria-label="Recent interactions">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Interactions
        </h2>
        {loading ? <LoadingSpinner /> : (
          summary?.recentInteractions?.length > 0 ? (
            <ul className="space-y-3" aria-label="Recent customer interactions">
              {summary.recentInteractions.map(interaction => (
                <li key={interaction._id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm shrink-0">
                    {interaction.type === 'call' ? '📞' : interaction.type === 'email' ? '📧' : interaction.type === 'meeting' ? '🤝' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {interaction.customerId?.name || 'Unknown Customer'}
                      </p>
                      <SentimentBadge label={interaction.sentimentLabel} size="xs" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {interaction.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(interaction.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No recent interactions
            </p>
          )
        )}
      </section>
    ),
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <section className="page-section-enter relative overflow-hidden rounded-3xl border border-slate-200 p-6 shadow-sm backdrop-blur dark:border-slate-700 sm:p-8">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-white/95 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-950/85" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_32%)]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.04),transparent_50%)]" aria-hidden="true" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
              {isAdmin ? 'Admin cockpit' : 'Sales workspace'}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {isAdmin
                ? 'Run the customer operation from one command center.'
                : `Good ${todayGreeting}, ${user?.name?.split(' ')[0] || 'there'}. Keep every follow-up moving.`}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {isAdmin
                ? 'Monitor customer health, churn exposure, and team activity without hopping between screens.'
                : 'Track customer sentiment, review churn risk, and focus on the conversations that need attention next.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/customers" className="btn-primary">
                Open customers
              </Link>
              <Link to="/reports" className="btn-secondary">
                View reports
              </Link>
              {isAdmin ? (
                <Link to="/users" className="btn-secondary">
                  Manage users
                </Link>
              ) : (
                <Link to="/settings" className="btn-secondary">
                  Review settings
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-linear-to-br from-slate-900 to-slate-950 p-4 text-white shadow-lg shadow-slate-900/20 dark:shadow-slate-900/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">Coverage</p>
              <p className="mt-2 text-3xl font-semibold">{summary?.totalCustomers ?? 0}</p>
              <p className="mt-1 text-sm text-slate-300">customers under active watch</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white/95 to-slate-50/90 p-4 shadow-sm dark:border-slate-700 dark:bg-linear-to-br dark:from-slate-900/90 dark:to-slate-950/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Risk</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{summary?.atRiskCount ?? 0}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">customers needing a closer look</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white/95 to-slate-50/90 p-4 shadow-sm dark:border-slate-700 dark:bg-linear-to-br dark:from-slate-900/90 dark:to-slate-950/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Activity</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{recentCount}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">recent interactions logged</p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {alertCount} churn alerts
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {summary?.positiveCount ?? 0} positive signals
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {summary?.negativeCount ?? 0} negative signals
          </span>
        </div>
      </section>

      {/* Render widgets in adaptive order */}
      {widgetOrder
        .filter(w => widgets[w]) // only render widgets that exist
        .map((widgetName, index) => (
          <div
            key={widgetName}
            className="page-section-enter"
            style={{ animationDelay: `${0.04 + index * 0.05}s` }}
          >
            {widgets[widgetName]}
          </div>
        ))
      }
    </div>
  )
}