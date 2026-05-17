import { useEffect, useState } from 'react'
import { dashboardApi } from '../../api/dashboardApi'
import LoadingSpinner from '../LoadingSpinner'
import clsx from 'clsx'

function MetricBar({ label, status, percent, subtext, tone = 'blue' }) {
  const barColor =
    percent === 0
      ? 'bg-red-500'
      : tone === 'green'
        ? 'bg-linear-to-r from-emerald-500 to-teal-400'
        : 'bg-linear-to-r from-blue-500 to-cyan-400'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className={clsx('text-xs font-semibold shrink-0', percent === 0 ? 'text-red-600' : 'text-slate-600 dark:text-slate-300')}>
          {status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={clsx('h-full rounded-full transition-all duration-700', barColor)} style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-500 w-8 text-right">{percent}%</span>
      </div>
      <p className="text-[11px] text-slate-400">{subtext}</p>
    </div>
  )
}

function HealthRing({ percent, uptime }) {
  const deg = Math.round((percent / 100) * 360)
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative h-28 w-28 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#3b82f6 0deg ${deg}deg, #e2e8f0 ${deg}deg 360deg)`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center px-2">
          <span className="text-2xl">🖥️</span>
          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Node Core</p>
        </div>
      </div>
      <p className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-400">{percent}% Health</p>
      <p className="text-[10px] text-slate-400">Uptime {uptime}</p>
    </div>
  )
}

export default function SystemStabilityWidget({ sseConnected }) {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await dashboardApi.getSystemHealth()
        if (!cancelled && res.data.success) setHealth(res.data.data)
      } catch {
        if (!cancelled) setHealth(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const degraded =
    health &&
    (!health.aiService.online || !health.mlEngine.online || health.overallHealth < 60)

  const metrics = health
    ? [
        {
          label: 'Flask AI VADER Service',
          status: health.aiService.online ? 'Online' : 'Offline',
          percent: health.aiService.percent,
          subtext: health.aiService.detail,
          tone: health.aiService.online ? 'blue' : 'red',
        },
        {
          label: 'SSE Real-Time Stream',
          status: sseConnected ? 'Optimal Connection' : 'Polling Fallback',
          percent: sseConnected ? 99 : 75,
          subtext: sseConnected ? 'Active connection' : 'Using notification polling',
        },
        {
          label: 'Predictive ML Engine',
          status: health.mlEngine.online ? 'Random Forest Active' : 'Offline',
          percent: health.mlEngine.percent,
          subtext: health.mlEngine.detail,
        },
        {
          label: 'MongoDB Database I/O',
          status: health.mongo.online ? 'Indexed Search' : 'Disconnected',
          percent: health.mongo.percent,
          subtext: health.mongo.detail,
          tone: 'green',
        },
      ]
    : []

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            System stability
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Live engine performance</h3>
        </div>
        {!loading && (
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
              degraded
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            )}
          >
            <span className={clsx('h-2 w-2 rounded-full', degraded ? 'bg-amber-500' : 'bg-emerald-500')} />
            {degraded ? 'Partial degradation' : 'All systems nominal'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            {metrics.map((m) => (
              <MetricBar key={m.label} {...m} />
            ))}
          </div>
          <HealthRing percent={health?.overallHealth ?? 0} uptime={health?.uptime ?? '—'} />
        </div>
      )}
    </section>
  )
}
