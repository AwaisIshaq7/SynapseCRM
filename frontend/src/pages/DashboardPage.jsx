import { useRef, useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { dashboardApi } from '../api/dashboardApi'
import { usersApi } from '../api/usersApi'
import { storage } from '../utils/storage'
import StatCard from '../components/StatCard'
import SentimentBadge from '../components/SentimentBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import AdminOverviewPanel from '../components/admin/AdminOverviewPanel'
import toast from 'react-hot-toast'
import { timeAgo } from '../utils/formatters'
import { getChurnRiskClasses } from '../utils/sentimentUtils'
import clsx from 'clsx'

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
)

// ─── SKELETON LOADER COMPONENTS ────────────────────────────
const StatCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
    <div className="mb-2 h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
    <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
  </div>
)

const ChartSkeleton = () => (
  <div className="flex h-56 items-center justify-center">
    <div className="h-40 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
  </div>
)

const AlertSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
        <div className="mb-2 h-4 w-32 rounded bg-slate-200 dark:bg-slate-700"></div>
        <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
      </div>
    ))}
  </div>
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

  // ─── NEW: Date Range State ─────────────────────────────────
  const [dateRange, setDateRange] = useState('7d')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [sentimentData, setSentimentData] = useState(sentimentTrend)
  const [chartLoading, setChartLoading] = useState(false)

  // ─── NEW: Search State ─────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searching, setSearching] = useState(false)

  // ─── NEW: Notifications State ──────────────────────────────
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  const dashboardRef = useRef(null)
  const [adminOverview, setAdminOverview] = useState(null)
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false)

  // ─── NEW: Sparkline/KPI Trends State ───────────────────────
  const [kpiTrends, setKpiTrends] = useState({
    totalCustomers: 0,
    atRiskCount: 0,
    positiveSentiment: 0,
    negativeSentiment: 0
  })

  // Determine widget order
  const defaultOrder = isAdmin ? ADMIN_DEFAULT_ORDER : MANAGER_DEFAULT_ORDER
  const widgetOrder = user?.preferences?.widgetOrder || defaultOrder

  // Usage tracking
  const usageCountRef = useRef(user?.usageLog || {})
  const sessionCount = useRef(0)

  // Track widget click
  const trackWidget = async (widgetName) => {
    usageCountRef.current[widgetName] = (usageCountRef.current[widgetName] || 0) + 1
    sessionCount.current += 1

    try {
      await usersApi.logUsage(widgetName)

      if (sessionCount.current >= 5) {
        const sorted = Object.entries(usageCountRef.current)
          .sort(([, a], [, b]) => b - a)
          .map(([name]) => name)
        const missing = defaultOrder.filter(w => !sorted.includes(w))
        const newOrder = [...sorted, ...missing]
        await usersApi.updatePreferences({ widgetOrder: newOrder })
        updateUserPreferences({ widgetOrder: newOrder })
        sessionCount.current = 0
        toast.success('Dashboard reordered based on your usage 🎯', { duration: 3000 })
      }
    } catch {
      // Silent fail
    }
  }

  // ─── NEW: Fetch Data with Date Range ───────────────────────
  const fetchSentimentWithDateRange = useCallback(async (range, customFrom, customTo) => {
    setChartLoading(true)
    try {
      let url = `/api/dashboard/sentiment-trend`
      if (range === 'custom' && customFrom && customTo) {
        url += `?from=${customFrom}&to=${customTo}`
      } else {
        url += `?range=${range}`
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${storage.getToken()}` }
      })
      const data = await response.json()
      if (data.success) {
        setSentimentData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch sentiment data:', error)
    } finally {
      setChartLoading(false)
    }
  }, [])

  // ─── NEW: Fetch Notifications ──────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${storage.getToken()}` }
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data)
        setUnreadCount(data.data.filter(n => !n.read).length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  // ─── NEW: Mark Notification as Read ────────────────────────
  const markNotificationRead = async (notificationId) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storage.getToken()}`
        },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification:', error)
    }
  }

  // ─── NEW: Global Search ────────────────────────────────────
  const handleSearch = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    setSearching(true)
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}&limit=8`, {
        headers: { 'Authorization': `Bearer ${storage.getToken()}` }
      })
      const data = await response.json()
      if (data.success) {
        setSearchResults(data.data)
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  // ─── NEW: Fetch KPI Trends ─────────────────────────────────
  const fetchKPITrends = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/trends', {
        headers: { 'Authorization': `Bearer ${storage.getToken()}` }
      })
      const data = await response.json()
      if (data.success) {
        setKpiTrends(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error)
    }
  }, [])

  const fetchAdminOverview = useCallback(async () => {
    if (!isAdmin) return
    setAdminOverviewLoading(true)
    try {
      const response = await dashboardApi.getAdminOverview()
      if (response.data.success) {
        setAdminOverview(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch admin overview:', error)
    } finally {
      setAdminOverviewLoading(false)
    }
  }, [isAdmin])

  // Initial data fetch for enhancements - FIXED: added dependencies
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchNotifications()
      fetchKPITrends()
      fetchAdminOverview()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchNotifications, fetchKPITrends, fetchAdminOverview])

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

  const sentimentChartData = (sentimentData || sentimentTrend) ? {
    labels: (sentimentData || sentimentTrend)?.labels || [],
    datasets: [
      {
        label: 'Positive',
        data: (sentimentData || sentimentTrend)?.positive || [],
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
        data: (sentimentData || sentimentTrend)?.neutral || [],
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
        data: (sentimentData || sentimentTrend)?.negative || [],
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
        grid: { color: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.2)' },
      },
      y: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
        grid: { color: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.2)' },
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
  const sentimentTotal = (summary?.positiveCount || 0) + (summary?.negativeCount || 0)
  const sentimentHealth = sentimentTotal
    ? Math.round(((summary?.positiveCount || 0) / sentimentTotal) * 100)
    : 0
  const riskCoverage = summary?.totalCustomers
    ? Math.round(((summary?.atRiskCount || 0) / summary.totalCustomers) * 100)
    : 0
  const currentHour = new Date().getHours()
  const todayGreeting = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening'

  // Scroll animation
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.scroll-animate')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
    )
    animatedElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [loading])

  // ─── WIDGET RENDERERS ─────────────────────────────────────
  const widgets = {
    summary: (
      <section key="summary" className="scroll-animate" onClick={() => trackWidget('summary')}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overview
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Customers"
              value={summary?.totalCustomers}
              loading={loading}
              trend={kpiTrends.totalCustomers}
              colorClass="text-brand-600 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              onClick={() => navigate('/customers')}
            />
            <StatCard
              label="At Risk"
              value={summary?.atRiskCount}
              loading={loading}
              trend={kpiTrends.atRiskCount}
              trendDown={true}
              colorClass="text-red-600 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              onClick={() => navigate('/customers?status=at_risk')}
            />
            <StatCard
              label="Positive Sentiment"
              value={summary?.positiveCount}
              loading={loading}
              trend={kpiTrends.positiveSentiment}
              colorClass="text-green-600 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Negative Sentiment"
              value={summary?.negativeCount}
              loading={loading}
              trend={kpiTrends.negativeSentiment}
              trendDown={true}
              colorClass="text-amber-600 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>
        )}
      </section>
    ),

    sentiment: (
      <section key="sentiment" className="card scroll-animate" onClick={() => trackWidget('sentiment')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sentiment Trend
          </h2>
          {/* Date Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-3 py-1.5 text-sm border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {dateRange === '7d' ? 'Last 7 days' : dateRange === '14d' ? 'Last 14 days' : 'Last 30 days'}
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border z-10">
                <div className="space-y-2">
                  <button onClick={() => { setDateRange('7d'); fetchSentimentWithDateRange('7d'); setShowDatePicker(false); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Last 7 days</button>
                  <button onClick={() => { setDateRange('14d'); fetchSentimentWithDateRange('14d'); setShowDatePicker(false); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Last 14 days</button>
                  <button onClick={() => { setDateRange('30d'); fetchSentimentWithDateRange('30d'); setShowDatePicker(false); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Last 30 days</button>
                </div>
              </div>
            )}
          </div>
        </div>
        {loading || chartLoading ? (
          <ChartSkeleton />
        ) : sentimentChartData ? (
          <div className="h-56">
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
      <section key="churn" className="card scroll-animate" onClick={() => trackWidget('churn')}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Churn Risk Distribution
        </h2>
        {loading ? (
          <ChartSkeleton />
        ) : churnChartData ? (
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 shrink-0">
              <Doughnut data={churnChartData} options={doughnutOptions} />
            </div>
            <div className="space-y-3">
              {[
                { label: 'High Risk', value: churnDist?.high || 0, color: 'bg-red-500' },
                { label: 'Medium Risk', value: churnDist?.medium || 0, color: 'bg-amber-500' },
                { label: 'Low Risk', value: churnDist?.low || 0, color: 'bg-green-500' },
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
      <section key="alerts" className="card border-l-4 border-l-red-500 scroll-animate" onClick={() => trackWidget('alerts')}>
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
        {loading ? (
          <AlertSkeleton />
        ) : summary?.churnAlerts?.length > 0 ? (
          <ul className="space-y-2">
            {summary.churnAlerts.map((alert, idx) => {
              const churnStyles = getChurnRiskClasses(alert.churnScore)
              return (
                <li key={alert._id} className="alert-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <Link
                    to={`/customers/${alert._id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
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
        )}
      </section>
    ),

    recent: (
      <section key="recent" className="card scroll-animate" onClick={() => trackWidget('recent')}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Interactions
        </h2>
        {loading ? (
          <AlertSkeleton />
        ) : summary?.recentInteractions?.length > 0 ? (
          <ul className="space-y-3">
            {summary.recentInteractions.map((interaction, idx) => (
              <li key={interaction._id} className="interaction-item" style={{ animationDelay: `${idx * 0.03}s` }}>
                <div className="flex items-start gap-3">
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
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            No recent interactions
          </p>
        )}
      </section>
    ),
  }

  return (
    <div ref={dashboardRef} className="max-w-7xl mx-auto space-y-6">
      {/* Top Bar with Search and Notifications */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searching && (
              <div className="absolute right-3 top-2.5">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
              {searchResults.map(customer => (
                <Link
                  key={customer._id}
                  to={`/customers/${customer._id}`}
                  onClick={() => setShowSearchResults(false)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.email} • {customer.company}</p>
                  </div>
                  {customer.churnScore && (
                    <span className={clsx('text-xs font-bold px-2 py-1 rounded-full', 
                      customer.churnScore > 0.7 ? 'bg-red-100 text-red-700' : 
                      customer.churnScore > 0.4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    )}>
                      {(customer.churnScore * 100).toFixed(0)}% risk
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border z-50">
                <div className="p-3 border-b font-semibold">Notifications</div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification._id}
                        onClick={() => markNotificationRead(notification._id)}
                        className={clsx('p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors',
                          !notification.read && 'bg-purple-50 dark:bg-purple-900/10'
                        )}
                      >
                        <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AI risk queue</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{alertCount}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">high-priority churn alerts</p>
            </div>
            <span className={clsx(
              'rounded-full px-3 py-1 text-xs font-semibold',
              riskCoverage >= 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            )}>
              {riskCoverage}% portfolio risk
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sentiment health</p>
          <div className="mt-3">
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{sentimentHealth}%</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{summary?.negativeCount ?? 0} negative signals</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${sentimentHealth}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Automation status</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Sentiment analysis</span>
              <span className="font-semibold text-emerald-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Churn refresh</span>
              <span className="font-semibold text-emerald-600">Scheduled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Synapse AI</span>
              <span className="font-semibold text-brand-600">On demand</span>
            </div>
          </div>
        </div>
      </section>

      {isAdmin && (
        <div className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_1fr]">
          <AdminOverviewPanel data={adminOverview} loading={adminOverviewLoading} />

          <div className="space-y-6">
            <div className="page-section-enter rounded-3xl border border-slate-200 bg-linear-to-r from-slate-900 to-slate-950 p-6 text-white shadow-lg shadow-slate-900/20 dark:border-slate-700/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-300">Admin dashboard</p>
              <h2 className="mt-2 text-2xl font-bold">Central command for team oversight</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Monitor every sales manager, their customers, and their latest interactions from a single admin-only view.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="page-section-enter relative overflow-hidden rounded-3xl border border-slate-200 p-6 shadow-sm backdrop-blur dark:border-slate-700 sm:p-8">
        <div className="absolute inset-0 bg-linear-to-br from-white/95 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-950/85" aria-hidden="true" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_32%)]" />
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
              <Link to="/customers" className="btn-primary">Open customers</Link>
              <Link to="/reports" className="btn-secondary">View reports</Link>
              {isAdmin ? (
                <Link to="/users" className="btn-secondary">Manage users</Link>
              ) : (
                <Link to="/settings" className="btn-secondary">Review settings</Link>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-linear-to-br from-slate-900 to-slate-950 p-4 text-white shadow-lg shadow-slate-900/20">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">Coverage</p>
                  <p className="mt-2 text-3xl font-semibold">{summary?.totalCustomers ?? 0}</p>
                  <p className="mt-1 text-sm text-slate-300">customers under active watch</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white/95 to-slate-50/90 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Risk</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{summary?.atRiskCount ?? 0}</p>
                  <p className="mt-1 text-sm text-slate-600">customers needing a closer look</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white/95 to-slate-50/90 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Activity</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{recentCount}</p>
                  <p className="mt-1 text-sm text-slate-600">recent interactions logged</p>
                </div>
              </>
            )}
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
      </div>

      {/* Render widgets in adaptive order */}
      {widgetOrder
        .filter(w => widgets[w])
        .map((widgetName, index) => (
          <div key={widgetName} className="page-section-enter" style={{ animationDelay: `${0.04 + index * 0.05}s` }}>
            {widgets[widgetName]}
          </div>
        ))}

      {/* Styles for animations */}
      <style>{`
        .scroll-animate { opacity: 0; transform: translateY(30px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
        .scroll-animate.animate-in { opacity: 1; transform: translateY(0); }
        .alert-item { opacity: 0; transform: translateX(-20px); animation: slideInRight 0.4s ease-out forwards; }
        .interaction-item { opacity: 0; transform: translateY(20px); animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .scroll-animate, .scroll-animate.animate-in, .alert-item, .interaction-item, .page-section-enter {
            opacity: 1 !important; transform: none !important; animation: none !important; transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
