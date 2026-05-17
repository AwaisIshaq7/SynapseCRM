import React, { useState } from 'react'
import { Line } from 'react-chartjs-2'
import { ChartSkeleton } from './DashboardSkeletons'

export default function SentimentTrendWidget({
  sentimentData,
  sentimentTrend,
  loading,
  chartLoading,
  dateRange,
  fetchSentimentWithDateRange,
  chartOptions,
  sentimentChartData,
  trackWidget
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  return (
    <section className="card scroll-animate" onClick={() => trackWidget('sentiment')}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sentiment Trend
        </h2>
        {/* Date Range Picker */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-3 py-1.5 text-sm border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 transition"
          >
            {dateRange === '7d' ? 'Last 7 days' : dateRange === '14d' ? 'Last 14 days' : 'Last 30 days'}
          </button>
          {showDatePicker && (
            <div className="absolute right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10 w-40">
              <div className="space-y-1">
                {[
                  { value: '7d', label: 'Last 7 days' },
                  { value: '14d', label: 'Last 14 days' },
                  { value: '30d', label: 'Last 30 days' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      fetchSentimentWithDateRange(opt.value)
                      setShowDatePicker(false)
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-sm text-slate-700 dark:text-slate-200 transition"
                  >
                    {opt.label}
                  </button>
                ))}
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
  )
}
