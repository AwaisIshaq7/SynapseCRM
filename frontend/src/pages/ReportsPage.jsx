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
  const { summary, sentimentTrend, churnDist, loading } = useDashboard()
  const [days, setDays] = useState(7)
  const isDark = user?.preferences?.theme === 'dark'

  const gridColor  = isDark ? '#374151' : '#f3f4f6'
  const tickColor  = isDark ? '#9ca3af' : '#6b7280'
  const legendColor = isDark ? '#d1d5db' : '#374151'

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: legendColor, font: { family: 'Inter', size: 12 } } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true },
    },
  }

  const sentimentData = sentimentTrend ? {
    labels: sentimentTrend.labels,
    datasets: [
      { label: 'Positive', data: sentimentTrend.positive, borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.15)', fill: true, tension: 0.4 },
      { label: 'Neutral',  data: sentimentTrend.neutral,  borderColor: '#d97706', backgroundColor: 'rgba(217,119,6,0.15)', fill: true, tension: 0.4 },
      { label: 'Negative', data: sentimentTrend.negative, borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.15)', fill: true, tension: 0.4 },
    ],
  } : null

  const churnBarData = churnDist ? {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      label: 'Customers',
      data: [churnDist.high || 0, churnDist.medium || 0, churnDist.low || 0],
      backgroundColor: ['rgba(220,38,38,0.8)', 'rgba(217,119,6,0.8)', 'rgba(22,163,74,0.8)'],
      borderRadius: 6,
    }],
  } : null

  const sentimentPieData = summary ? {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [summary.positiveCount || 0, (summary.totalCustomers - summary.positiveCount - summary.negativeCount) || 0, summary.negativeCount || 0],
      backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
      borderColor: isDark ? '#1f2937' : '#fff',
      borderWidth: 3,
    }],
  } : null

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visual breakdown of customer sentiment and churn risk</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="xl" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Trend Line Chart */}
          <div className="card lg:col-span-2">
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
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Churn Risk Distribution</h2>
            <div className="h-56" role="img" aria-label="Bar chart showing customer count by churn risk level">
              {churnBarData
                ? <Bar data={churnBarData} options={{ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: false } } }} />
                : <p className="text-center text-gray-400 pt-16 text-sm">No churn data available</p>
              }
            </div>
          </div>

          {/* Sentiment Breakdown Pie */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Sentiment Breakdown</h2>
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 flex-shrink-0" role="img" aria-label="Doughnut chart of overall customer sentiment">
                {sentimentPieData
                  ? <Doughnut data={sentimentPieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
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