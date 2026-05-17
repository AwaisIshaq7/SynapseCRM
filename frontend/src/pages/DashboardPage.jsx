import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { useNotifications } from '../hooks/useNotifications'
import { dashboardApi } from '../api/dashboardApi'
import { usersApi } from '../api/usersApi'
import { storage } from '../utils/storage'
import axiosInstance from '../api/axiosInstance'
import AdminOverviewPanel from '../components/admin/AdminOverviewPanel'
import ServiceStatusWidget from '../components/dashboard/ServiceStatusWidget'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// Decomposed dashboard components
import DashboardHero from '../components/dashboard/DashboardHero'
import DashboardTopBar from '../components/dashboard/DashboardTopBar'
import SummaryWidget from '../components/dashboard/SummaryWidget'
import SentimentTrendWidget from '../components/dashboard/SentimentTrendWidget'
import ChurnDistributionWidget from '../components/dashboard/ChurnDistributionWidget'
import ChurnAlertsWidget from '../components/dashboard/ChurnAlertsWidget'
import RecentInteractionsWidget from '../components/dashboard/RecentInteractionsWidget'

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
)

const ADMIN_DEFAULT_ORDER   = ['summary', 'churn', 'sentiment', 'recent', 'alerts']
const MANAGER_DEFAULT_ORDER = ['alerts', 'sentiment', 'summary', 'recent', 'churn']

export default function DashboardPage() {
  const { user, isAdmin, updateUserPreferences } = useAuth()
  const { summary, sentimentTrend, churnDist, loading } = useDashboard()
  const navigate = useNavigate()

  // Real-time SSE Notifications Hook (replaces polling & manual fetch!)
  const { notifications, unreadCount, connected: sseConnected, markAsRead } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  // Date Range and Filter State
  const [dateRange, setDateRange] = useState('7d')
  const [sentimentData, setSentimentData] = useState(null)
  const [chartLoading, setChartLoading] = useState(false)

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searching, setSearching] = useState(false)

  // Admin overview state
  const dashboardRef = useRef(null)
  const [adminOverview, setAdminOverview] = useState(null)
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false)

  // KPI Trend sparklines State
  const [kpiTrends, setKpiTrends] = useState({
    totalCustomers: 0,
    atRiskCount: 0,
    positiveSentiment: 0,
    negativeSentiment: 0
  })

  // Determine widget layout order
  const defaultOrder = isAdmin ? ADMIN_DEFAULT_ORDER : MANAGER_DEFAULT_ORDER
  const widgetOrder = user?.preferences?.widgetOrder || defaultOrder

  // Adaptive widget optimization count
  const usageCountRef = useRef(user?.usageLog || {})
  const sessionCount = useRef(0)

  // Track widget click to dynamically customize default widget positions
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
        toast.success('Dashboard layout optimized for your usage! 🎯', { duration: 3000 })
      }
    } catch (err) {
      console.warn('Silent layout save failure:', err)
    }
  }

  // Fetch trend graphs with Custom Date range
  const fetchSentimentWithDateRange = useCallback(async (range) => {
    setChartLoading(true)
    setDateRange(range)
    try {
      const daysParam = range === '7d' ? 7 : range === '14d' ? 14 : 30
      const response = await dashboardApi.getSentimentTrend(daysParam)
      if (response.data.success) {
        setSentimentData(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch sentiment trend:', error)
    } finally {
      setChartLoading(false)
    }
  }, [])

  // Global search input handling
  const handleSearch = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    setSearching(true)
    try {
      const response = await axiosInstance.get(`/customers/search?q=${encodeURIComponent(query)}&limit=8`)
      if (response.data.success) {
        setSearchResults(response.data.data)
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Search query failed:', error)
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounce search requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleSearch])

  // Fetch aggregate KPI trends sparklines
  const fetchKPITrends = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/dashboard/trends')
      if (response.data.success) {
        setKpiTrends(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch KPI trends:', error)
    }
  }, [])

  // Admin commands fetch
  const fetchAdminOverview = useCallback(async () => {
    if (!isAdmin) return
    setAdminOverviewLoading(true)
    try {
      const response = await dashboardApi.getAdminOverview()
      if (response.data.success) {
        setAdminOverview(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch admin dashboard summary:', error)
    } finally {
      setAdminOverviewLoading(false)
    }
  }, [isAdmin])

  // Component mount configurations
  useEffect(() => {
    fetchKPITrends()
    fetchAdminOverview()
  }, [fetchKPITrends, fetchAdminOverview])

  // Scroll animations observer setup
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
      { threshold: 0.05, rootMargin: '0px 0px -10px 0px' }
    )
    animatedElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [loading])

  // ─── Chartjs Configuration Builders ───────────────────────────
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

  const activeTrendData = sentimentData || sentimentTrend

  const sentimentChartData = activeTrendData ? {
    labels: activeTrendData.labels || [],
    datasets: [
      {
        label: 'Positive',
        data: activeTrendData.positive || [],
        borderColor: '#16a34a',
        backgroundColor: (context) => getAreaGradient(context, 'rgba(22,163,74,0.22)', 'rgba(22,163,74,0.01)'),
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
      },
      {
        label: 'Neutral',
        data: activeTrendData.neutral || [],
        borderColor: '#d97706',
        backgroundColor: (context) => getAreaGradient(context, 'rgba(217,119,6,0.18)', 'rgba(217,119,6,0.01)'),
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
      },
      {
        label: 'Negative',
        data: activeTrendData.negative || [],
        borderColor: '#dc2626',
        backgroundColor: (context) => getAreaGradient(context, 'rgba(220,38,38,0.18)', 'rgba(220,38,38,0.01)'),
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
      },
    ],
  } : null

  const churnChartData = churnDist ? {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [churnDist.high || 0, churnDist.medium || 0, churnDist.low || 0],
      backgroundColor: ['#dc2626', '#d97706', '#16a34a'],
      borderColor: isDark ? '#0f172a' : '#fff',
      borderWidth: 3,
      hoverOffset: 6,
    }],
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 11, family: 'sans-serif' } }
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#fff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 10 } },
        grid: { color: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.1)' },
      },
      y: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280', font: { size: 10 } },
        grid: { color: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.1)' },
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    radius: '95%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#fff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 8,
      },
    },
  }

  const recentCount = summary?.recentInteractions?.length || 0
  const alertCount = summary?.churnAlerts?.length || 0
  const sentimentTotal = (summary?.positiveCount || 0) + (summary?.negativeCount || 0)
  const sentimentHealth = sentimentTotal ? Math.round(((summary?.positiveCount || 0) / sentimentTotal) * 100) : 0
  const riskCoverage = summary?.totalCustomers ? Math.round(((summary?.atRiskCount || 0) / summary.totalCustomers) * 100) : 0

  // ─── Dynamic Layout Widget Map ─────────────────────────────
  const widgets = {
    summary: (
      <SummaryWidget
        key="summary"
        summary={summary}
        kpiTrends={kpiTrends}
        loading={loading}
        trackWidget={trackWidget}
      />
    ),
    sentiment: (
      <SentimentTrendWidget
        key="sentiment"
        sentimentData={sentimentData}
        sentimentTrend={sentimentTrend}
        loading={loading}
        chartLoading={chartLoading}
        dateRange={dateRange}
        fetchSentimentWithDateRange={fetchSentimentWithDateRange}
        chartOptions={chartOptions}
        sentimentChartData={sentimentChartData}
        trackWidget={trackWidget}
      />
    ),
    churn: (
      <ChurnDistributionWidget
        key="churn"
        churnDist={churnDist}
        loading={loading}
        churnChartData={churnChartData}
        doughnutOptions={doughnutOptions}
        trackWidget={trackWidget}
      />
    ),
    alerts: (
      <ChurnAlertsWidget
        key="alerts"
        summary={summary}
        loading={loading}
        trackWidget={trackWidget}
      />
    ),
    recent: (
      <RecentInteractionsWidget
        key="recent"
        summary={summary}
        loading={loading}
        trackWidget={trackWidget}
      />
    ),
  }

  return (
    <div ref={dashboardRef} className="max-w-7xl mx-auto space-y-6">
      
      {/* Search and SSE notifications top bar */}
      <DashboardTopBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searching={searching}
        searchResults={searchResults}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        markNotificationRead={markAsRead}
        sseConnected={sseConnected}
      />

      {/* Main Stat KPI summary details */}
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
              riskCoverage >= 30 ? 'bg-red-50 text-red-700 dark:bg-red-950/30' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
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
              <span className="text-slate-600 dark:text-slate-300">Churn prediction</span>
              <span className="font-semibold text-emerald-600">Random Forest</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Realtime Push</span>
              <span className={clsx('font-semibold', sseConnected ? 'text-emerald-600' : 'text-slate-500')}>
                {sseConnected ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Central command control panel */}
      {isAdmin && (
        <div className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_1fr]">
          <AdminOverviewPanel data={adminOverview} loading={adminOverviewLoading} />
          
          <div className="space-y-6">
            <div className="page-section-enter rounded-3xl border border-slate-200 bg-linear-to-r from-slate-900 to-slate-950 p-6 text-white shadow-lg dark:border-slate-700/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-300">Admin command center</p>
              <h2 className="mt-2 text-2xl font-bold">Central command for team oversight</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Monitor sales manager productivity, customer accounts distribution, and overall risk levels across your portfolio.
              </p>
            </div>
            
            <div className="page-section-enter" style={{ animationDelay: '0.1s' }}>
              <ServiceStatusWidget sseConnected={sseConnected} />
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic greeting hero widget */}
      <DashboardHero
        user={user}
        isAdmin={isAdmin}
        summary={summary}
        recentCount={recentCount}
        loading={loading}
      />

      {/* Render widgets dynamically in adaptive order */}
      {widgetOrder
        .filter(w => widgets[w])
        .map((widgetName, index) => (
          <div key={widgetName} className="page-section-enter" style={{ animationDelay: `${0.04 + index * 0.05}s` }}>
            {widgets[widgetName]}
          </div>
        ))}

      {/* Custom micro-interactions animation styling */}
      <style>{`
        .scroll-animate { opacity: 0; transform: translateY(20px); transition: opacity 0.4s ease-out, transform 0.4s ease-out; }
        .scroll-animate.animate-in { opacity: 1; transform: translateY(0); }
        .alert-item { opacity: 0; transform: translateX(-15px); animation: slideInRight 0.35s ease-out forwards; }
        .interaction-item { opacity: 0; transform: translateY(15px); animation: fadeInUp 0.35s ease-out forwards; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .scroll-animate, .scroll-animate.animate-in, .alert-item, .interaction-item, .page-section-enter {
            opacity: 1 !important; transform: none !important; animation: none !important; transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}
