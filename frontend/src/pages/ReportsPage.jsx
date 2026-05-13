import { useState } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useDashboard } from '../hooks/useDashboard'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function ReportsPage() {
  const { user } = useAuth()
  const [days, setDays] = useState(7)
  const { summary, sentimentTrend, churnDist, loading } = useDashboard(days)
  const isDark = user?.preferences?.theme === 'dark'

  const gridColor  = isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.2)'
  const tickColor  = isDark ? '#9ca3af' : '#6b7280'
  const legendColor = isDark ? '#d1d5db' : '#374151'

  const getAreaGradient = (context, startColor, endColor) => {
    const { chart } = context
    const { ctx, chartArea } = chart
    if (!chartArea) return endColor

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    gradient.addColorStop(0, startColor)
    gradient.addColorStop(1, endColor)
    return gradient
  }

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: legendColor, font: { family: 'Inter', size: 12 } } },
      tooltip: {
        mode: 'index',
        intersect: false,
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
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true },
    },
  }

  const sentimentData = sentimentTrend ? {
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
        backgroundColor: (context) => getAreaGradient(context, 'rgba(217,119,6,0.28)', 'rgba(217,119,6,0.02)'),
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
        backgroundColor: (context) => getAreaGradient(context, 'rgba(220,38,38,0.28)', 'rgba(220,38,38,0.02)'),
        fill: true,
        tension: 0.4,
        borderWidth: 2.2,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  } : null

  const churnBarData = churnDist ? {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      label: 'Customers',
      data: [churnDist.high || 0, churnDist.medium || 0, churnDist.low || 0],
      backgroundColor: (context) => {
        if (context.dataIndex === 0) return getAreaGradient(context, 'rgba(220,38,38,0.92)', 'rgba(248,113,113,0.62)')
        if (context.dataIndex === 1) return getAreaGradient(context, 'rgba(217,119,6,0.92)', 'rgba(251,191,36,0.62)')
        return getAreaGradient(context, 'rgba(22,163,74,0.92)', 'rgba(74,222,128,0.62)')
      },
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.8)',
    }],
  } : null

  const sentimentPieData = summary ? {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [summary.positiveCount || 0, (summary.totalCustomers - summary.positiveCount - summary.negativeCount) || 0, summary.negativeCount || 0],
      backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
      borderColor: isDark ? '#1f2937' : '#fff',
      borderWidth: 3,
      hoverOffset: 10,
    }],
  } : null

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '64%',
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="page-section-enter rounded-2xl bg-linear-to-r from-purple-50/50 to-pink-50/50 dark:from-slate-900/50 dark:to-slate-800/50 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visual breakdown of customer sentiment and churn risk</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="xl" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Trend Line Chart */}
          <div className="card page-section-enter lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sentiment Trend</h2>
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="input w-32 text-sm"
                aria-label="Select time range"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>
            <div className="h-64" role="img" aria-label="Sentiment trend over time line chart">
              {sentimentData
                ? <Line data={sentimentData} options={baseChartOptions} />
                : <p className="text-center text-gray-400 pt-20 text-sm">No sentiment data available yet</p>
              }
            </div>
          </div>

          {/* Churn Distribution Bar */}
          <div className="card page-section-enter">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Churn Risk Distribution</h2>
            <div className="h-56" role="img" aria-label="Bar chart showing customer count by churn risk level">
              {churnBarData
                ? <Bar data={churnBarData} options={{ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: false } } }} />
                : <p className="text-center text-gray-400 pt-16 text-sm">No churn data available</p>
              }
            </div>
          </div>

          {/* Sentiment Breakdown Pie */}
          <div className="card page-section-enter">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Sentiment Breakdown</h2>
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 shrink-0" role="img" aria-label="Doughnut chart of overall customer sentiment">
                {sentimentPieData
                  ? <Doughnut data={sentimentPieData} options={pieOptions} />
                  : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data</div>
                }
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Positive', value: summary?.positiveCount || 0,  color: 'bg-green-500' },
                  { label: 'Negative', value: summary?.negativeCount || 0,  color: 'bg-red-500' },
                  { label: 'Neutral',  value: (summary?.totalCustomers - (summary?.positiveCount || 0) - (summary?.negativeCount || 0)) || 0, color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} aria-hidden="true" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white ml-auto">{item.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white ml-auto">{summary?.totalCustomers || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}