import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler
)

function dayKey(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function lastNDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

export default function CustomerSentimentChart({ interactions = [] }) {
  const { scoreChart, volumeChart, hasData } = useMemo(() => {
    const days = lastNDays(3)
    const labels = days.map((d) =>
      d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    )

    const scoresByDay = Object.fromEntries(days.map((d) => [dayKey(d), []]))
    const countsByDay = Object.fromEntries(days.map((d) => [dayKey(d), 0]))

    for (const item of interactions) {
      const key = dayKey(item.date)
      if (!(key in scoresByDay)) continue
      countsByDay[key] += 1
      if (item.sentimentScore != null && !Number.isNaN(item.sentimentScore)) {
        scoresByDay[key].push(item.sentimentScore)
      }
    }

    const avgScores = days.map((d) => {
      const vals = scoresByDay[dayKey(d)]
      if (!vals.length) return null
      return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
    })

    const volumes = days.map((d) => countsByDay[dayKey(d)])

    return {
      hasData: avgScores.some((v) => v != null) || volumes.some((v) => v > 0),
      scoreChart: {
        labels,
        datasets: [
          {
            label: 'Avg sentiment',
            data: avgScores,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            fill: true,
            tension: 0.35,
            spanGaps: true,
          },
        ],
      },
      volumeChart: {
        labels,
        datasets: [
          {
            label: 'Interactions',
            data: volumes,
            backgroundColor: ['#93c5fd', '#60a5fa', '#3b82f6'],
            borderRadius: 6,
          },
        ],
      },
    }
  }, [interactions])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' } },
      x: { grid: { display: false } },
    },
  }

  const scoreOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: { min: -1, max: 1, grid: { color: 'rgba(148,163,184,0.2)' } },
    },
  }

  if (!hasData) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        No interaction data in the last 3 days yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-44 p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Sentiment (3 days)</p>
        <Line data={scoreChart} options={scoreOptions} />
      </div>
      <div className="h-44 p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Activity (3 days)</p>
        <Bar data={volumeChart} options={chartOptions} />
      </div>
    </div>
  )
}
